"use client";

import { useState, useRef, useEffect, forwardRef } from "react";

// ── Types ──────────────────────────────────────────────────

// A single chat message — either something the user typed,
// or something the AI responded with.
type Message = {
  role: "user" | "assistant";
  content: string;
};

// Props passed in from the parent page (e.g. "Good morning", "Subomi")
type ChatAreaProps = {
  greeting: string;
  firstName: string;
};

// ── Main component ────────────────────────────────────────
// This is the landing/chat screen shown when a user opens a new chat.
// Before any message is sent, it shows a centered greeting + input.
// After the first message, it switches to a normal scrolling chat layout.

export default function ChatArea({ greeting, firstName }: ChatAreaProps) {
  // All messages in the current conversation
  const [messages, setMessages] = useState<Message[]>([]);

  // Current text typed into the input box
  const [input, setInput] = useState("");

  // True while waiting for / streaming the AI's response
  const [loading, setLoading] = useState(false);

  // Invisible marker at the bottom of the chat — used to auto-scroll down
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reference to the actual <input> DOM element, so we can call .focus() on it
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ────────────────────────────────────────────
  // Every time messages change (new message added, or AI text streaming in),
  // smoothly scroll down so the latest message is visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-focus on load / after AI responds ─────────────────
  // Whenever "loading" turns false (page just loaded, or the AI just
  // finished replying), automatically put the cursor back in the input box
  // so the user can keep typing without clicking it again.
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  // ── Global "always typing into the input" behavior ─────────
  // If the user clicks anywhere else on the page (e.g. the middle of the
  // chat) and then starts typing, this listener catches that keystroke
  // and redirects focus back to the input box — similar to how ChatGPT
  // and Claude's own chat work. It ignores:
  //   - keystrokes that are already happening inside another input/textarea
  //   - keyboard shortcuts (Cmd/Ctrl/Alt + key), so things like Cmd+C still work
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", handleGlobalKey);
    // Cleanup: remove the listener when this component unmounts
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // ── Send a message ──────────────────────────────────────────
  // Called when the user submits the form (presses Enter / clicks send).
  // Sends the full conversation history to /api/chat and streams the
  // AI's reply back in real time, updating the UI as each chunk arrives.
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const history = [...messages, userMessage];

    // Immediately show the user's message, plus an empty AI bubble
    // (which will fill in as the streamed response arrives)
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No course context on the home screen — the server uses a general
        // study-assistant prompt for this intent.
        body: JSON.stringify({ messages: history, intent: "general" }),
      });

      if (!response.ok || !response.body) throw new Error("Request failed");

      // Read the streamed response chunk by chunk
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // The server sends Server-Sent Events (SSE) — lines starting with "data: "
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            // Pull out just the text delta from this chunk and append it
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages([
                ...history,
                { role: "assistant", content: assistantContent },
              ]);
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
    } catch {
      // If the request fails entirely, show a fallback error message
      setMessages([
        ...history,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {messages.length === 0 ? (
        // ── Empty state: centered greeting + input (before first message) ──
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
              {greeting}, {firstName}.
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              What would you like to learn today?
            </p>
          </div>
          <form onSubmit={handleSend} className="w-full max-w-2xl">
            <ChatInput
              ref={inputRef}
              input={input}
              setInput={setInput}
              loading={loading}
            />
          </form>
        </div>
      ) : (
        // ── Active chat: scrolling message list + input pinned at bottom ──
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.content ||
                      // While the AI's reply is still empty and it's the last
                      // message, show a "typing" bouncing-dots animation
                      (loading && i === messages.length - 1 ? (
                        <span className="inline-flex gap-1 items-center h-4">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </span>
                      ) : null)}
                  </div>
                </div>
              ))}
              {/* Invisible div we scroll to on every new message */}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="border-t border-gray-100 px-4 py-4">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto">
              <ChatInput
                ref={inputRef}
                input={input}
                setInput={setInput}
                loading={loading}
              />
            </form>
          </div>
        </>
      )}
    </div>
  );
}

// ── ChatInput ──────────────────────────────────────────────
// The text input + send button. It's wrapped in forwardRef so the parent
// (ChatArea) can grab a direct reference to the underlying <input> DOM
// element and call .focus() on it — that's what powers the auto-focus
// behavior above. Without forwardRef, a ref placed on <ChatInput /> would
// just point at the component itself, not the actual input element inside it.
const ChatInput = forwardRef<HTMLInputElement, {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
}>(({ input, setInput, loading }, ref) => {
  return (
    <div className="relative">
      <input
        type="text"
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything..."
        disabled={loading}
        className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!input.trim() || loading}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M12 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
});

// Required when using forwardRef — gives the component a readable name
// in React DevTools instead of showing up as "Anonymous"
ChatInput.displayName = "ChatInput";