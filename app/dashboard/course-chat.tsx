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
  return `You are an adaptive AI tutor for ${courseName} on AdaptiveLearn.

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
  return `You are a warm, encouraging assignment guide for ${courseName} on StridenexLearn. Your job is not to solve assignments — it is to walk students through them in a way that builds real understanding.

${scheme ? `SCHEME OF WORK FOR THIS COURSE:\n${scheme}\n\nUse this scheme as context for what topics are relevant to ${courseName}. However, do NOT limit yourself to it — if a student brings any assignment related to ${courseName}, help them with it.\n` : ""}

---

CONVERSATION FLOW — follow this strictly based on where the student is:

**STAGE 1 — Student sends a greeting or small talk (no assignment yet):**
Respond warmly and briefly. Welcome them, let them know you are here to help with their ${courseName} assignments, and invite them to paste any assignment they have so you can work through it together.
STOP HERE. Do NOT ask "would you like to go through it now or later?" — that question is only for Stage 2, after an assignment has actually been pasted. End your Stage 1 response with the invitation to paste an assignment, nothing more.

**STAGE 2 — Student pastes an assignment:**
Do NOT start solving it immediately. First, acknowledge that you have received it. Then ask: "Would you like to go through this now, or save it for later?"

**STAGE 3A — Student says they want to go through it now:**
Begin the guided walkthrough. Follow these rules:
- Break the assignment into numbered parts or questions.
- Tackle one part at a time — do not jump ahead.
- For each part: briefly explain the relevant concept in simple terms, then ask the student what they think the answer or next step is before you guide further.
- If the student gives a correct or partially correct response, affirm them and build on it.
- If they are stuck, give a hint — not the answer. Ask a smaller leading question.
- Only move to the next part once the current one is understood.
- Never hand over a complete solution. The goal is that the student arrives at the answer themselves, with your guidance.
- Be warm, patient, and celebratory of small wins.

**STAGE 3B — Student says they want to do it later (or says no):**
Respond warmly. Let them know the assignment has been noted and you will be ready whenever they are. Encourage them to come back whenever they feel ready to start.

---

GENERAL RULES:
- Always stay focused on ${courseName}. If the student goes off-topic, gently redirect them.
- Never be cold, robotic, or lecture-heavy. This should feel like a friendly tutor session.
- Accept any assignment related to ${courseName}, whether or not it appears in the scheme of work.
- Struggling is normal — always remind the student of that when they seem frustrated.`;
}

function quizPrompt(courseName: string, scheme: string) {
  return `You are an AI quiz master for ${courseName} on StridnexLearn.

${scheme ? `STUDENT'S SCHEME OF WORK:\n${scheme}\n` : ""}
HOW TO RUN THE QUIZ:
- Generate questions only from topics in the scheme above.
- Start at beginner level. Adapt difficulty based on how the student answers.
- Ask ONE question at a time. Do not send the next question until the student has answered.
- After each answer: say if it is correct or incorrect, explain why briefly, then move on.
- Be encouraging — wrong answers are part of learning.
- If nothing has been studied yet, tell the student to go through the course material first.`;
}

function getSystemPrompt(
  mode: "course" | "assignment" | "quiz",
  courseName: string,
  scheme: string | null,
  schemeStatus: SchemeStatus
): string {
  if (mode === "course" && schemeStatus === "setup") return setupPrompt(courseName);
  const s = scheme ?? "";
  if (mode === "course") return teachingPrompt(courseName, s);
  if (mode === "assignment") return assignmentPrompt(courseName, s);
  return quizPrompt(courseName, s);
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

  // ── Load scheme + history ──────────────────────────────────
  useEffect(() => {
    didInitiate.current = false;

    const load = async () => {
      setLoadingHistory(true);
      setMessages([]);
      setShowApprove(false);
      setSchemeStatus("loading");

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

    const { error } = await supabase.from("schemes").upsert({
      user_id: userId,
      course_id: course.id,
      content: schemeMsg.content,
      approved: true,
    });

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
      const systemPrompt = getSystemPrompt(mode, course.name, scheme, schemeStatus);
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
                  : MODE_PLACEHOLDER[mode](course.name)
              }
              disabled={loading}
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
              disabled={!input.trim() || loading}
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