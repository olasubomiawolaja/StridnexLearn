"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Course } from "./sidebar";

// ── Types ──────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type SchemeStatus = "loading" | "setup" | "ready";
type TopicsStatus = "idle" | "loading" | "ready";

type Props = {
  course: Course;
  mode: "course" | "assignment" | "quiz";
  userId: string;
};

// ── System prompts ─────────────────────────────────────────

function setupPrompt(courseName: string) {
  return `You are a warm, encouraging AI tutor helping a student set up their ${courseName} course on StridnexLearn.

Your ONLY job right now is to create a personalised scheme of work. Follow these steps ONE AT A TIME — do not rush.

STEP 1: Ask: "Do you have a scheme of work or syllabus for ${courseName}?"

If the student says YES:
- Ask them to paste it as text
- Once they paste it, organise it into a clean numbered list with main topics and subtopics
- Present it clearly and ask: "Does this look right? I'll use this to guide all your sessions."

If the student says NO:
- Ask ONLY: "What country are you studying in?"

After they answer:
- Ask ONLY: "What is the full name of your school?"

After they answer:
- Ask ONLY: "What level are you at? (e.g. WAEC, JAMB, A-Level, 100 Level University, etc.)"

After collecting the country, school name, and level:
- Perform background research before generating the scheme of work.
- First, look for an official curriculum, syllabus, course outline, handbook, departmental guide, or scheme of work from the student's school.
- If an official source cannot be found, look for equivalent curricula from similar institutions in the same country, education system, and academic level.
- Use the gathered information to infer the most appropriate learning sequence and topics for the course.
- Prioritize accuracy and relevance to the student's educational context.
- Never generate a completely random scheme of work.
- Never mention that research was performed.
- Never tell the student that information was obtained from a website, search, curriculum lookup, or external source.
- Simply present the final scheme of work as if it were the natural next step in the tutoring process.

Then generate a detailed scheme with:
  * 8 to 12 main topics in the correct learning order
  * 3 to 5 subtopics under each main topic
  * A one-line description of each main topic

Present the scheme clearly with numbering.

End with:
"Does this look right? If you want changes tell me, or approve it and we'll start learning."

Rules:
- Ask ONE thing at a time. Never dump multiple questions in one message.
- Be warm and conversational, not robotic.
- Keep your messages short and focused.
- Never mention internal reasoning, research steps, sources consulted, or how the scheme was generated.`;
}

function teachingPrompt(courseName: string, scheme: string) {
  return `You are an adaptive AI tutor for ${courseName} on Stridnexlearn.

SCHEME OF WORK FOR THIS STUDENT:
${scheme}

HOW TO TEACH:
- Follow this scheme. Start from the very first topic and work through in order.
- Always assume the student is a complete beginner unless they show otherwise.
- Each topic is to be treated throughly before moving to the next. Don't rush ahead.
- Never give a direct answer. Explain the concept clearly and detailed explanation, then ask the student to apply it.
- After every explanation, ask at least one follow-up question before moving to the next subtopic.
- When the student gives a good answer, make sure the students understands that particular aspect of the topic very well before naturally moviing to the next subtopic.
- Keep your explanations clear and digestible — avoid walls of text.
- If the student goes off topic, gently say "Let's stay focused on ${courseName} for now — we can explore that separately."
- Be warm, patient, and encouraging at all times.`;
}

function assignmentPrompt(courseName: string, scheme: string) {
  return `You are a warm, Socratic assignment guide for ${courseName} on StridnexLearn. Your entire purpose is to make the student think their way to the answer — not to explain, define, or summarise concepts for them.

${scheme ? `SCHEME OF WORK FOR THIS COURSE:\n${scheme}\n\nUse this scheme as context for what topics are relevant to ${courseName}. However, do NOT limit yourself to it — if a student brings any assignment related to ${courseName}, help them with it.\n` : ""}

---

CONVERSATION FLOW — follow this strictly based on where the student is:

**STAGE 1 — Student sends a greeting or small talk (no assignment yet):**
Respond warmly and briefly. Welcome them, let them know you are here to help with their ${courseName} assignments, and invite them to paste any assignment they have so you can work through it together.
STOP HERE. Do NOT ask "would you like to go through it now or later?" — that question is only for Stage 2. End your Stage 1 response with the invitation to paste, nothing more.

**STAGE 2 — Student pastes an assignment:**
Do NOT start solving it or explaining anything. First, acknowledge you have received it. Then ask: "Would you like to go through this now, or save it for later?"

**STAGE 3A — Student says they want to go through it now:**
Begin the Socratic walkthrough. Follow these rules strictly:

BREAKING DOWN THE ASSIGNMENT:
- Read the full assignment and silently number every individual question or sub-part.
- Tell the student how many parts there are and that you will go through them one at a time.
- Begin with Part 1 only.

WORKING THROUGH EACH PART:
- Do NOT open with an explanation or definition. Lead with a real-world scenario or concrete situation that mirrors the concept being tested. The scenario should be vivid and simple enough that the student can reason about it intuitively — before they "know" the answer formally.
- After presenting the scenario, ask ONE focused question and stop. Do not ask follow-up questions in the same message. Wait for the student's response.
- Always use the correct academic terminology for ${courseName} — never replace proper terms with casual substitutes. Scenarios are a tool to build intuition toward the academic concept, not a replacement for it. For example, in a physics question about speed, use the word "speed", reference the formula (speed = distance ÷ time), and connect the scenario back to the formal concept once the student is close to the answer.

WAITING FOR AN ANSWER:
- After asking your question, STOP. Do not move to the next part. Do not ask another question. Wait.
- Only advance to the next part after two conditions are met: (1) the student has given a direct answer attempt, and (2) you have confirmed it is correct — or corrected it and confirmed they now understand.
- If the student's response is off-topic, a joke, vague, or does not constitute a real answer attempt, do not treat it as one. Gently redirect them back to the question with warmth.

WHEN A STUDENT IS STUCK OR WRONG:
- Do NOT reveal the answer directly.
- Do NOT pile on multiple new questions or sub-questions in one message.
- Instead, approach from a simpler angle — strip the scenario down to its most everyday, concrete form and ask one smaller leading question. One question. Then stop and wait.
- If they are still stuck after two attempts, you may offer a more direct hint — but still frame it as a question, not a statement. For example: "What do you get when you divide 8 by 2?" rather than "8 divided by 2 gives you 4."
- Once they arrive at the correct answer, affirm them specifically and connect their intuition back to the formal academic concept — name the term, state the rule or formula, and make the bridge explicit.

MOVING FORWARD:
- Only move to the next part after the current one is fully resolved and the student has demonstrated understanding.
- Announce the transition clearly: "Great — that's Part 1 done. Let's move on to Part 2."

**STAGE 3B — Student says they want to do it later (or says no):**
Respond warmly. Let them know the assignment has been noted and you will be ready whenever they are. Encourage them to come back when they feel ready.

---

GENERAL RULES:
- Stay focused on ${courseName}. If the student goes off-topic, gently redirect them.
- Never open with a definition or concept summary — always lead with a scenario or situation that makes the student think first.
- Scenarios build intuition. Academic language locks in the learning. You need both — never sacrifice one for the other.
- Never be cold, robotic, or lecture-heavy. This should feel like a curious, friendly tutor who asks great questions.
- Accept any assignment related to ${courseName}, whether or not it appears in the scheme of work.
- Struggling is normal — always remind the student of that when they seem frustrated. Normalise not knowing the answer yet.
- One question per message. Always. No exceptions.`;
}

function quizPrompt(courseName: string, topicsCovered: string) {
  return `You are an AI quiz master for ${courseName} on StridnexLearn.

TOPICS THE STUDENT HAS ACTUALLY COVERED SO FAR:
${topicsCovered ? topicsCovered : "(none)"}

---

STAGE 1 — GREETING:
- If the student's first message is a greeting (e.g. "hi", "hello", "hey", "good morning"), respond with a warm, friendly welcome — e.g. "Welcome to your ${courseName} quiz session on StridnexLearn! I'm your quiz master, here to put what you've learned to the test. Whenever you're ready, just let me know and we'll get started!"
- STOP there. Do NOT ask about question count or format. Do NOT mention anything about topics yet. Just greet and wait.

---

STAGE 2 — WHEN THE STUDENT TRIES TO START A QUIZ:
This stage is triggered when the student says anything that signals they want to quiz — e.g. "let's go", "give me 5 questions", "start the quiz", "quiz me", "I'm ready", or specifies a count or format.

When this happens, your FIRST action is to check the topics list above.

IF topics list is empty or says "(none)":
- Respond with: "It looks like you haven't covered any course material or assignments yet. Please go through the course content or work on some assignments first — then come back and I'll be ready to quiz you!"
- Do not ask about count or format. Do not proceed with any quiz questions whatsoever.
- If the student pushes back (e.g. "I just want to try", "give me any question", "I want to see what it's like"): respond with "I understand you're eager to get quizzing, but the questions are built around what you've actually studied. Explore the course content or try some assignments first — I'll be right here when you're ready!" Then stop.
- Keep blocking every attempt until topics exist. This check never expires.

IF topics exist:
- Ask two things: (1) how many questions they'd like, and (2) what format — multiple choice, theory/short answer, fill-in-the-blank, or a mix of all three.
- Wait for their answer before doing anything else.

---

STAGE 3 — RUNNING THE QUIZ:
- Once the student replies with their count and/or format preference, confirm in one short line (e.g. "Got it — 10 questions, mix of all three formats. Let's go!") then immediately begin Question 1.
- If they don't specify a count, keep going until they stop. If they don't specify a format, default to multiple choice.
- Generate questions ONLY from the topics listed above — never go beyond them.
- Ask ONE question at a time. Never send more than one question per message, no matter what.
- Start at beginner level. Adapt difficulty based on performance.
- If a count was given, number every question ("Question 1 of 10", "Question 2 of 10", etc.).
- If multiple formats were requested, spread them evenly and rotate — never cluster the same format.

AFTER EACH ANSWER:
1. State whether the answer is correct or incorrect.
2. Give a brief explanation — if correct, reinforce why; if wrong, gently correct them, state the right answer, and give a short refresher. Keep it concise — this is a quiz, not a lesson.

END OF QUIZ:
- After the final question is answered and explained, wrap up warmly. Report the final score (e.g. "You finished with 8 correct out of 10 — great effort!").
- Close with: "That's a wrap on this session! I'm here whenever you're ready for another quiz."
- If the student wants another quiz immediately, treat it as a fresh session — ask for count and format again, reset score to 0.

---

QUESTION FORMATS:
- Multiple choice — short stem with lettered options (A, B, C, D).
- Theory / short answer — open-ended question, no options given.
- Fill-in-the-blank — a sentence with a blank the student completes.`;
}

function topicsSummaryPrompt(courseName: string) {
  return `You are summarizing what a student has actually been taught in their ${courseName} tutoring sessions, based on the tutor's own messages below (pulled from their course lessons and assignment help sessions).

Extract a compact list of the specific topics and subtopics that have genuinely been taught or worked through — this is a record of what happened, not a course outline or plan.

Rules:
- Output ONLY a short bullet list. No preamble, no commentary, no closing remarks.
- Group related subtopics under their main topic where that makes sense.
- Keep each bullet short — a few words, not full sentences.
- If the messages reflect very little teaching content, return a short list reflecting only that.`;
}


function getSystemPrompt(
  mode: "course" | "assignment" | "quiz",
  courseName: string,
  scheme: string | null,
  schemeStatus: SchemeStatus,
  quizTopics: string | null
): string {
  if (mode === "course" && schemeStatus === "setup") return setupPrompt(courseName);
  const s = scheme ?? "";
  if (mode === "course") return teachingPrompt(courseName, s);
  if (mode === "assignment") return assignmentPrompt(courseName, s);
  return quizPrompt(courseName, quizTopics ?? "");
}

// ── Mode config ────────────────────────────────────────────

const MODE_LABEL: Record<string, string> = {
  course: "Course Chat",
  assignment: "Assignment Help",
  quiz: "Quiz Practice",
};

const MODE_PLACEHOLDER: Record<string, (name: string) => string> = {
  course: () => `Reply to your tutor...`,
  assignment: () => "Paste your assignment question...",
  quiz: (name) => `Answer the question about ${name}...`,
};

const MODE_EMPTY = {
  course:     { emoji: "📚", title: (n: string) => `Start learning ${n}`,  desc: "Ask a question or type a topic. Your tutor will guide you from the beginning." },
  assignment: { emoji: "📝", title: (n: string) => `${n} assignment help`,  desc: "Paste your assignment and your tutor will guide you through it step by step." },
  quiz:       { emoji: "🧠", title: (n: string) => `${n} quiz practice`,    desc: "Your AI quiz master will generate questions and adapt to your level." },
};

// ── Component ──────────────────────────────────────────────

export default function CourseChat({ course, mode, userId }: Props) {
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [schemeStatus, setSchemeStatus]     = useState<SchemeStatus>("loading");
  const [scheme, setScheme]                 = useState<string | null>(null);
  const [showApprove, setShowApprove]       = useState(false);
  const [savingScheme, setSavingScheme]     = useState(false);
  const [copiedId, setCopiedId]             = useState<string | null>(null);
  const [quizTopics, setQuizTopics]         = useState<string | null>(null);
  const [topicsStatus, setTopicsStatus]     = useState<TopicsStatus>("idle");

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const didInitiate  = useRef(false);
  const supabase     = useMemo(() => createClient(), []);

  // ── Stream helper ──────────────────────────────────────────
  const streamResponse = useCallback(
    async (
      history: { role: "user" | "assistant"; content: string }[],
      systemPrompt: string,
      tmpAiId: string
    ) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, systemPrompt }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === tmpAiId ? { ...m, content: fullText } : m))
              );
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      return fullText;
    },
    []
  );

  // ── Save message ───────────────────────────────────────────
  const saveMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({ user_id: userId, course_id: course.id, mode, role, content })
        .select("id, role, content, created_at")
        .single();
      if (!error && data) return data as Message;
      return null;
    },
    [supabase, userId, course.id, mode]
  );

  // ── Sync quiz topics: cached summary of what's actually been taught ──
  // Only re-summarizes when there are course/assignment messages newer than
  // the cached summary. Otherwise reuses the cached `topics_covered` value
  // on the schemes row, so quiz loads stay cheap.
  const syncQuizTopics = useCallback(async () => {
    setTopicsStatus("loading");

    // Latest message timestamp across course + assignment chats for this course
    const { data: latest } = await supabase
      .from("chat_messages")
      .select("created_at")
      .eq("course_id", course.id)
      .eq("user_id", userId)
      .in("mode", ["course", "assignment"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestMessageAt = latest?.created_at ?? null;

    // Nothing studied yet — nothing to quiz on
    if (!latestMessageAt) {
      setQuizTopics(null);
      setTopicsStatus("ready");
      return;
    }

    // Check the cached summary on the schemes row
    const { data: schemeRow } = await supabase
      .from("schemes")
      .select("content, topics_covered, topics_updated_at")
      .eq("course_id", course.id)
      .eq("user_id", userId)
      .maybeSingle();

    const cacheIsFresh =
      !!schemeRow?.topics_updated_at &&
      new Date(schemeRow.topics_updated_at).getTime() >= new Date(latestMessageAt).getTime();

    if (cacheIsFresh && schemeRow?.topics_covered) {
      setQuizTopics(schemeRow.topics_covered);
      setTopicsStatus("ready");
      return;
    }

    // Stale (or no cache yet) — regenerate from the tutor's own messages
    const { data: taughtMessages } = await supabase
      .from("chat_messages")
      .select("content, mode")
      .eq("course_id", course.id)
      .eq("user_id", userId)
      .eq("role", "assistant")
      .in("mode", ["course", "assignment"])
      .order("created_at", { ascending: true });

    if (!taughtMessages || taughtMessages.length === 0) {
      setQuizTopics(null);
      setTopicsStatus("ready");
      return;
    }

    const transcript = taughtMessages.map((m) => `[${m.mode}] ${m.content}`).join("\n\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: transcript }],
          systemPrompt: topicsSummaryPrompt(course.name),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Summary request failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let summary   = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) summary += delta;
          } catch { /* skip malformed chunks */ }
        }
      }

      // `content` is NOT NULL on this table. Postgres validates that on the
      // candidate insert row even when ON CONFLICT will turn it into an
      // update — so it has to be sent on every upsert, not just when no row
      // exists yet. We pass back the existing value (a no-op for the
      // update), or an empty placeholder if there's no row to read from.
      const { error: upsertError } = await supabase
        .from("schemes")
        .upsert(
          {
            user_id: userId,
            course_id: course.id,
            content: schemeRow?.content ?? "",
            topics_covered: summary,
            topics_updated_at: latestMessageAt,
          },
          { onConflict: "user_id,course_id" }
        );

      if (upsertError) {
        console.error("Failed to cache quiz topics:", upsertError);
      }

      setQuizTopics(summary);
    } catch {
      // Fall back to whatever was cached before, even if stale, rather than blocking the quiz
      setQuizTopics(schemeRow?.topics_covered ?? null);
    } finally {
      setTopicsStatus("ready");
    }
  }, [supabase, course.id, course.name, userId]);

  // ── Load scheme + history ──────────────────────────────────
  useEffect(() => {
    didInitiate.current = false;

    const load = async () => {
      setLoadingHistory(true);
      setMessages([]);
      setShowApprove(false);
      setSchemeStatus("loading");
      setQuizTopics(null);
      setTopicsStatus("idle");

      // Check for approved scheme
      const { data: schemeData } = await supabase
        .from("schemes")
        .select("content, approved")
        .eq("course_id", course.id)
        .eq("user_id", userId)
        .maybeSingle();

      const hasScheme = schemeData?.approved && schemeData.content;
      if (hasScheme) {
        setScheme(schemeData!.content);
        setSchemeStatus("ready");
      } else {
        setSchemeStatus("setup");
      }

      // Load chat history
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("course_id", course.id)
        .eq("mode", mode)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!error && data) setMessages(data as Message[]);
      setLoadingHistory(false);
    };

    load();
  }, [course.id, mode, userId, supabase]);

  // ── Trigger quiz topics sync once per course/mode load ─────
  useEffect(() => {
    if (mode !== "quiz" || loadingHistory || topicsStatus !== "idle") return;
    syncQuizTopics();
  }, [mode, loadingHistory, topicsStatus, syncQuizTopics]);

  // ── Auto-initiate: AI speaks first on a fresh course ──────
  useEffect(() => {
    if (
      loadingHistory ||
      schemeStatus === "loading" ||
      schemeStatus === "ready" ||
      mode !== "course" ||
      messages.length > 0 ||
      didInitiate.current
    ) return;

    didInitiate.current = true;

    const initiate = async () => {
      setLoading(true);
      const tmpAiId = `tmp-a-${Date.now()}`;
      setMessages([{ id: tmpAiId, role: "assistant", content: "" }]);

      try {
        const fullText = await streamResponse(
          [{ role: "user", content: "__init__" }],
          `${setupPrompt(course.name)}\n\nThe student just opened the course for the first time. Start immediately by greeting them warmly (one sentence) then ask your first question.`,
          tmpAiId
        );
        saveMessage("assistant", fullText).then((saved) => {
          if (saved) setMessages((prev) => prev.map((m) => (m.id === tmpAiId ? saved : m)));
        });
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    initiate();
  }, [loadingHistory, schemeStatus, mode, messages.length, course.name, streamResponse, saveMessage]);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Auto-focus input after loading ────────────────────────
  useEffect(() => {
    if (!loadingHistory && !loading) inputRef.current?.focus();
  }, [loadingHistory, loading]);

  // ── Global keydown → always redirect typing to input ──────
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // ── Show approve button when AI presents a scheme ──────────
  useEffect(() => {
    if (schemeStatus !== "setup" || mode !== "course" || loading) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    const hasNumbers = /^\s*[1-9]\.\s/m.test(last.content);
    setShowApprove(hasNumbers && last.content.length > 150);
  }, [messages, schemeStatus, mode, loading]);

  // ── Copy message ───────────────────────────────────────────
  const handleCopy = useCallback(async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // ── Approve scheme ─────────────────────────────────────────
  const handleApproveScheme = async () => {
    const schemeMsg = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          m.content.length > 150 &&
          /^\s*[1-9]\.\s/m.test(m.content)
      );
    if (!schemeMsg) return;

    setSavingScheme(true);

    const { error } = await supabase.from("schemes").upsert(
      {
        user_id: userId,
        course_id: course.id,
        content: schemeMsg.content,
        approved: true,
      },
      { onConflict: "user_id,course_id" }
    );

    if (!error) {
      setScheme(schemeMsg.content);
      setSchemeStatus("ready");
      setShowApprove(false);

      const tmpAiId = `tmp-confirm-${Date.now()}`;
      setMessages((prev) => [...prev, { id: tmpAiId, role: "assistant", content: "" }]);
      setLoading(true);

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        history.push({
          role: "user",
          content: "I approve the scheme. Let's start learning from the beginning.",
        });

        const fullText = await streamResponse(
          history,
          teachingPrompt(course.name, schemeMsg.content),
          tmpAiId
        );
        saveMessage("assistant", fullText).then((saved) => {
          if (saved) setMessages((prev) => prev.map((m) => (m.id === tmpAiId ? saved : m)));
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tmpAiId
              ? { ...m, content: "Great! Your scheme is approved. Let's start learning from the first topic." }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    }

    setSavingScheme(false);
  };

  // ── Send message ───────────────────────────────────────────
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    if (mode === "quiz" && topicsStatus !== "ready") return;

    setInput("");
    setLoading(true);
    setShowApprove(false);

    const userMsg: Message = { id: `tmp-u-${Date.now()}`, role: "user", content: trimmed };
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: trimmed },
    ];
    setMessages((prev) => [...prev, userMsg]);

    saveMessage("user", trimmed).then((saved) => {
      if (saved) setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? saved : m)));
    });

    const tmpAiId = `tmp-a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tmpAiId, role: "assistant", content: "" }]);

    try {
      const systemPrompt = getSystemPrompt(mode, course.name, scheme, schemeStatus, quizTopics);
      const fullText = await streamResponse(history, systemPrompt, tmpAiId);

      saveMessage("assistant", fullText).then((saved) => {
        if (saved) setMessages((prev) => prev.map((m) => (m.id === tmpAiId ? saved : m)));
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tmpAiId
            ? { ...m, content: "Something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="relative flex h-full flex-col overflow-hidden">

      {/* Course pill */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {course.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="max-w-[220px] truncate text-sm font-semibold leading-tight text-gray-900">
              {course.name}
            </h2>
            <p className="text-xs text-gray-400">
              {schemeStatus === "setup" && mode === "course"
                ? "Setting up your scheme of work"
                : mode === "quiz" && topicsStatus !== "ready"
                ? "Reviewing what you've covered"
                : MODE_LABEL[mode]}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-24">
        <div className="max-w-2xl mx-auto space-y-4">

          {loadingHistory || schemeStatus === "loading" ? (
            <div className="space-y-4">
              {[60, 80, 50].map((w, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div
                    className="h-10 rounded-2xl animate-pulse bg-gray-100"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-xl">
                {MODE_EMPTY[mode].emoji}
              </div>
              <h3 className="font-semibold text-gray-800">{MODE_EMPTY[mode].title(course.name)}</h3>
              <p className="text-sm text-gray-400 max-w-xs">{MODE_EMPTY[mode].desc}</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isUser   = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      isUser
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.content ||
                      (loading && i === messages.length - 1 ? (
                        <span className="inline-flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ) : null)}
                  </div>

                  {/* Action icons — visible only on hover */}
                  {msg.content && (
                    <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        title="Copy"
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Scheme actions: Approve / Edit / Decline */}
          {showApprove && !loading && (
            <div className="flex justify-center gap-2 py-2 flex-wrap">
              <button
                onClick={handleApproveScheme}
                disabled={savingScheme}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {savingScheme ? "Saving..." : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve — start learning
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setInput("Please make these changes to the scheme: ");
                  setShowApprove(false);
                  document.querySelector("textarea")?.focus();
                }}
                disabled={savingScheme}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit scheme
              </button>

              <button
                onClick={() => {
                  setShowApprove(false);
                  setInput("This scheme doesn't look right. Please generate a different one.");
                  document.querySelector("textarea")?.focus();
                }}
                disabled={savingScheme}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-4 shrink-0">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                schemeStatus === "setup" && mode === "course"
                  ? "Reply to set up your scheme of work..."
                  : mode === "quiz" && topicsStatus !== "ready"
                  ? "Reviewing what you've covered..."
                  : MODE_PLACEHOLDER[mode](course.name)
              }
              disabled={loading || (mode === "quiz" && topicsStatus !== "ready")}
              rows={1}
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 disabled:opacity-60 resize-none overflow-hidden"
              style={{ minHeight: "52px", maxHeight: "160px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || (mode === "quiz" && topicsStatus !== "ready")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}