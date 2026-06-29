import { createClient } from "@/lib/supabase-server";
import {
  setupPrompt,
  teachingPrompt,
  assignmentPrompt,
  quizPrompt,
  topicsSummaryPrompt,
  initiateSuffix,
  generalAssistantPrompt,
  adaptiveContext,
} from "@/lib/prompts";
import {
  getUserState,
  updateUserState,
  recordTopicScore,
  getLatestSessionSummary,
  saveSessionSummary,
  type UserState,
} from "@/lib/user-state";
import {
  scoreAnswer,
  summarizeSession,
  computeLevel,
  nextSchemeTopic,
  MASTERY_THRESHOLD,
} from "@/lib/adaptive";
import type { SupabaseClient } from "@supabase/supabase-js";

type Mode = "course" | "assignment" | "quiz";
type Intent = "chat" | "initiate" | "summary" | "general" | "endsession";
type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  // ── 1. Require a signed-in user ──────────────────────────
  // Without this anyone who finds the endpoint could spend our Groq key.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // ── 2. Parse + sanitise the request ──────────────────────
  const body = await request.json().catch(() => null);
  if (!body) return new Response("Bad request", { status: 400 });

  const { courseId, mode, intent = "chat" } = body as {
    courseId?: string;
    mode?: Mode;
    intent?: Intent;
  };

  // ── 2a. End-of-session summary (no stream) ───────────────
  // Fired by the client when it leaves a course chat. We read that chat's
  // history from the DB, condense it, and store it so the tutor can pick up
  // where it left off next time. Returns JSON, not a stream.
  if (intent === "endsession") {
    return endSession(supabase, user.id, courseId, mode);
  }

  // Only forward user/assistant turns with string content — never trust the
  // shape of what the browser sends.
  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m: unknown): m is ChatMessage =>
            !!m &&
            typeof (m as ChatMessage).content === "string" &&
            ((m as ChatMessage).role === "user" ||
              (m as ChatMessage).role === "assistant")
        )
        .map((m: ChatMessage) => ({ role: m.role, content: m.content }))
    : [];

  if (messages.length === 0)
    return new Response("No messages", { status: 400 });

  // ── 3. Build the system prompt HERE, on the server ───────
  // The browser cannot override this — it only picks mode/intent.
  let systemPrompt: string;

  if (intent === "general") {
    // The dashboard "new chat" home screen — no course context.
    systemPrompt = generalAssistantPrompt();
  } else {
    // Every other intent is tied to a specific course the user owns.
    if (!courseId) return new Response("Missing courseId", { status: 400 });

    // Validate the mode once, here, so it's a known `Mode` (not `Mode |
    // undefined`) for the adaptive engine below — which scores, summarises,
    // and personalises per mode and must never run with an undefined one.
    if (mode !== "course" && mode !== "assignment" && mode !== "quiz") {
      return new Response("Invalid mode", { status: 400 });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!course) return new Response("Course not found", { status: 404 });

    const { data: schemeRow } = await supabase
      .from("schemes")
      .select("content, approved, topics_covered")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    const scheme = schemeRow?.content ?? "";
    const hasApprovedScheme = !!(schemeRow?.approved && schemeRow.content);

    if (intent === "summary") {
      // Pure extraction of taught topics — not student-specific, no adaptation.
      systemPrompt = topicsSummaryPrompt(course.name);
    } else {
      // ── Adaptive engine (Phase 4) ──────────────────────────
      // Read this student's state, grade their last answer, and personalise
      // the prompt. Each step is best-effort: a failure never blocks the reply.
      let state = await getUserState(supabase, user.id, courseId);

      // On the first teaching turn after a scheme is approved, anchor the
      // student to the first topic so progression has somewhere to start.
      if (mode === "course" && hasApprovedScheme && !state.currentTopic) {
        const first = nextSchemeTopic(scheme, null);
        if (first) {
          await updateUserState(supabase, user.id, courseId, {
            currentTopic: first,
          });
          state = { ...state, currentTopic: first };
        }
      }

      // Score the student's previous answer and adapt state (chat turns only —
      // "initiate" is the AI speaking first, there's no answer to grade).
      if (intent === "chat") {
        state = await scoreAndAdapt(
          supabase,
          user.id,
          courseId,
          course.name,
          mode,
          scheme,
          messages,
          state
        );
      }

      const lastSummary = await getLatestSessionSummary(
        supabase,
        user.id,
        courseId,
        mode === "quiz" ? "quiz" : mode === "assignment" ? "assignment" : "course"
      );
      const context = adaptiveContext(state, lastSummary);

      // Base prompt for the mode/intent.
      let base: string;
      let useAdaptive: boolean;
      if (intent === "initiate") {
        // Fresh course, no scheme yet — this is scheme setup, not teaching.
        base = setupPrompt(course.name) + initiateSuffix();
        useAdaptive = false;
      } else if (mode === "course") {
        base = hasApprovedScheme
          ? teachingPrompt(course.name, scheme)
          : setupPrompt(course.name);
        useAdaptive = hasApprovedScheme;
      } else if (mode === "assignment") {
        base = assignmentPrompt(course.name, scheme);
        useAdaptive = true;
      } else if (mode === "quiz") {
        base = quizPrompt(course.name, schemeRow?.topics_covered ?? "");
        useAdaptive = true;
      } else {
        return new Response("Invalid mode", { status: 400 });
      }

      // Personalise once we're actually teaching/helping; scheme setup stays
      // generic (there's nothing to adapt to yet).
      systemPrompt = useAdaptive && context ? context + base : base;
    }
  }

  // ── 4. Stream from Groq ──────────────────────────────────
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    return new Response("Groq API error", { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

// ── Agent loop step: grade the last answer, update mastery/level/topic ──────
// Returns the (possibly updated) state to build the next prompt from. Always
// returns a usable state — every external call is wrapped so a failure here
// degrades to "no adaptation this turn" rather than breaking the chat.
async function scoreAndAdapt(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  courseName: string,
  mode: Mode,
  scheme: string,
  messages: ChatMessage[],
  state: UserState
): Promise<UserState> {
  try {
    // The student's new answer is the last message; the tutor's question is
    // the most recent assistant turn before it.
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return state;
    const answer = last.content;

    let question = "";
    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        question = messages[i].content;
        break;
      }
    }
    if (!question) return state; // nothing was asked yet — nothing to grade

    const result = await scoreAnswer({
      courseName,
      currentTopic: state.currentTopic,
      question,
      answer,
    });
    if (!result) return state; // not a gradable answer (greeting, "ok", etc.)

    // Persist the topic score (also recomputes weak areas).
    await recordTopicScore(supabase, userId, courseId, result.topic, result.score);

    // Re-read so we have the merged topic_scores/weak_areas, then derive level
    // and (in course mode) advance the focus topic on mastery.
    const merged = await getUserState(supabase, userId, courseId);
    const patch: Partial<UserState> = {
      currentLevel: computeLevel(merged.topicScores),
    };

    if (
      mode === "course" &&
      result.mastered &&
      result.score >= MASTERY_THRESHOLD
    ) {
      const next = nextSchemeTopic(scheme, merged.currentTopic);
      if (next && next !== merged.currentTopic) patch.currentTopic = next;
    }

    await updateUserState(supabase, userId, courseId, patch);
    return { ...merged, ...patch };
  } catch (err) {
    console.error("scoreAndAdapt failed:", err);
    return state;
  }
}

// ── End-of-session summary handler ──────────────────────────────────────────
async function endSession(
  supabase: SupabaseClient,
  userId: string,
  courseId: string | undefined,
  mode: Mode | undefined
): Promise<Response> {
  if (!courseId || !mode) return new Response("Bad request", { status: 400 });

  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!course) return new Response("Course not found", { status: 404 });

  // Pull this chat's recent history (cap to keep the summary call cheap).
  const { data: rows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .eq("mode", mode)
    .order("created_at", { ascending: true });

  const msgs = (rows ?? []) as ChatMessage[];
  // Need a real back-and-forth before a recap is worth writing.
  if (msgs.length < 2) return Response.json({ ok: true, skipped: true });

  const transcript = msgs
    .slice(-40)
    .map(
      (m) =>
        `${m.role === "user" ? "Student" : "Tutor"}: ${m.content.slice(0, 1200)}`
    )
    .join("\n\n");

  const summary = await summarizeSession(course.name, mode, transcript);
  if (summary) {
    await saveSessionSummary(supabase, userId, courseId, mode, summary);
  }

  return Response.json({ ok: true });
}
