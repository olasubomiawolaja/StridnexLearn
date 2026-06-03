"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { Course } from "./sidebar";

// ── Types ──────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type Props = {
  course: Course;
  mode: "course" | "assignment" | "quiz";
  userId: string;
};

// ── Mode config ────────────────────────────────────────────
const MODE_LABEL = {
  course:     "Course Chat",
  assignment: "Assignment Help",
  quiz:       "Quiz Practice",
};

const MODE_PLACEHOLDER = {
  course:     (name: string) => `Ask about ${name}...`,
  assignment: ()             => "Paste your assignment question...",
  quiz:       (name: string) => `Ready for a ${name} quiz question?`,
};

const MODE_EMPTY = {
  course:     { emoji: "📚", title: (n: string) => `Start learning ${n}`,          desc: "Ask a question or type a topic. Your tutor will guide you from the beginning." },
  assignment: { emoji: "📝", title: (n: string) => `${n} assignment help`,          desc: "Paste your assignment and your tutor will guide you through it step by step." },
  quiz:       { emoji: "🧠", title: (n: string) => `${n} quiz practice`,            desc: "Your AI quiz master will generate questions and adapt to your level." },
};

const SYSTEM_PROMPT = {
  course: (name: string) =>
    `You are an adaptive AI tutor for the subject: ${name}.
You must ONLY discuss topics related to ${name}. If the student asks about anything unrelated, politely redirect them.
Always start by assuming the student is a complete beginner — never assume prior knowledge.
Never just give answers. Explain concepts clearly first, then ask follow-up questions to test understanding.
Be patient, encouraging, and adaptive. If the student struggles, slow down and try a different explanation.`,

  assignment: (name: string) =>
    `You are an AI assignment helper for ${name}.
The student needs help with a ${name} assignment. Do NOT just solve it for them.
Guide them step by step — ask what they've tried, explain relevant concepts, and help them reach the answer themselves.
Stay strictly within the topic of ${name}.`,

  quiz: (name: string) =>
    `You are an AI quiz master for ${name}.
Generate quiz questions on ${name} topics. Start at beginner level and adapt difficulty based on responses.
After each answer, give clear feedback explaining why it is correct or incorrect, then move to the next question.
Stay strictly within the topic of ${name}.`,
};

// ── Component ──────────────────────────────────────────────
export default function CourseChat({ course, mode, userId }: Props) {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase  = useMemo(() => createClient(), []);

  // ── Load chat history ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      setMessages([]);

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
  }, [course.id, mode, supabase, userId]);

  // ── Auto-scroll ────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Save a message to Supabase ─────────────────────────
  const saveMessage = async (role: "user" | "assistant", content: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, course_id: course.id, mode, role, content })
      .select("id, role, content, created_at")
      .single();

    if (!error && data) return data as Message;
    return null;
  };

  // ── Send message ───────────────────────────────────────
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);

    // Build history for API
    const userMsg: Message = { id: `tmp-u-${Date.now()}`, role: "user", content: trimmed };
    const history = [
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user" as const, content: trimmed },
    ];
    setMessages((prev) => [...prev, userMsg]);

    // Save user message to DB (fire and update id)
    saveMessage("user", trimmed).then((saved) => {
      if (saved) setMessages((prev) => prev.map((m) => m.id === userMsg.id ? saved : m));
    });

    // Placeholder for streaming assistant reply
    const tmpAiId = `tmp-a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tmpAiId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemPrompt: SYSTEM_PROMPT[mode](course.name),
        }),
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
                prev.map((m) => m.id === tmpAiId ? { ...m, content: fullText } : m)
              );
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      // Save completed assistant message to DB
      saveMessage("assistant", fullText).then((saved) => {
        if (saved) setMessages((prev) => prev.map((m) => m.id === tmpAiId ? saved : m));
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

  const empty = MODE_EMPTY[mode];

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="relative flex h-full flex-col overflow-hidden">

      {/* Floating course pill */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {course.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="max-w-[220px] truncate text-sm font-semibold leading-tight text-gray-900">{course.name}</h2>
            <p className="text-xs text-gray-400">{MODE_LABEL[mode]}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-24">
        <div className="max-w-2xl mx-auto space-y-4">

          {loadingHistory ? (
            // Skeleton
            <div className="space-y-4">
              {[60, 80, 50].map((w, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className={`h-10 rounded-2xl animate-pulse bg-gray-100`} style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-xl">
                {empty.emoji}
              </div>
              <h3 className="font-semibold text-gray-800">{empty.title(course.name)}</h3>
              <p className="text-sm text-gray-400 max-w-xs">{empty.desc}</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
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
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-4 shrink-0">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={MODE_PLACEHOLDER[mode](course.name)}
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
