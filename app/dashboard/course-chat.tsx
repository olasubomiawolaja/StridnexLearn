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

// System prompts now live on the server (lib/prompts.ts) and are built inside
// the /api/chat route. The browser only sends { courseId, mode, intent } — it
// never sends prompt text, so the tutor's rules can't be overridden from here.

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
  const [showApprove, setShowApprove]       = useState(false);
  const [savingScheme, setSavingScheme]     = useState(false);
  const [copiedId, setCopiedId]             = useState<string | null>(null);
  // The quiz-topics summary is cached in the DB (schemes.topics_covered) and
  // read by the server; the client only tracks whether that sync has finished.
  const [topicsStatus, setTopicsStatus]     = useState<TopicsStatus>("idle");

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const didInitiate  = useRef(false);
  const supabase     = useMemo(() => createClient(), []);

  // Phase 4 session summaries: track which chat is active and how many
  // messages it has, so when the student leaves we can ask the server to
  // summarise it for next time.
  const activeSession = useRef<{ courseId: string; mode: string } | null>(null);
  const msgCount      = useRef(0);

  // ── Stream helper ──────────────────────────────────────────
  const streamResponse = useCallback(
    async (
      history: { role: "user" | "assistant"; content: string }[],
      intent: "chat" | "initiate",
      tmpAiId: string
    ) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No systemPrompt — the server builds it from courseId + mode + intent.
        body: JSON.stringify({ messages: history, courseId: course.id, mode, intent }),
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
    [course.id, mode]
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
          courseId: course.id,
          mode,
          intent: "summary",
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
    } catch {
      // Sync failed — leave any previously cached summary in place rather than
      // blocking the quiz. The server reads topics_covered from the DB.
    } finally {
      setTopicsStatus("ready");
    }
  }, [supabase, course.id, userId, mode]);

  // ── Load scheme + history ──────────────────────────────────
  useEffect(() => {
    didInitiate.current = false;

    const load = async () => {
      setLoadingHistory(true);
      setMessages([]);
      setShowApprove(false);
      setSchemeStatus("loading");
      setTopicsStatus("idle");

      // Check for an approved scheme — the actual content is read server-side;
      // here we only need to know whether setup is done.
      const { data: schemeData } = await supabase
        .from("schemes")
        .select("content, approved")
        .eq("course_id", course.id)
        .eq("user_id", userId)
        .maybeSingle();

      const hasScheme = schemeData?.approved && schemeData.content;
      setSchemeStatus(hasScheme ? "ready" : "setup");

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

  // ── Session summary: save a recap when leaving a chat ──────
  // Keep a live count of the current chat's messages…
  useEffect(() => {
    msgCount.current = messages.length;
  }, [messages]);

  // …and when the student switches course/mode (or unmounts), ask the server
  // to summarise the chat they just left. `keepalive` lets the request finish
  // even as this view tears down. The server reads the transcript from the DB
  // and stores the summary; the next session reads it back. Fire-and-forget.
  useEffect(() => {
    activeSession.current = { courseId: course.id, mode };
    return () => {
      const s = activeSession.current;
      // Need a real exchange (a question + at least one reply) to be worth it.
      if (!s || msgCount.current < 2) return;
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: s.courseId,
          mode: s.mode,
          intent: "endsession",
        }),
        keepalive: true,
      }).catch(() => {
        /* best-effort — a missed recap just means a colder start next time */
      });
    };
  }, [course.id, mode]);

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
          "initiate",
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
  }, [loadingHistory, schemeStatus, mode, messages.length, streamResponse, saveMessage]);

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

        // The scheme was just upserted with approved:true above, so the server
        // will pick the teaching prompt for this "chat" turn.
        const fullText = await streamResponse(history, "chat", tmpAiId);
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
      const fullText = await streamResponse(history, "chat", tmpAiId);

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