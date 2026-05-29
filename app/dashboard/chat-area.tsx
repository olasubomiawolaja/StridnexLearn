"use client";

import { useState } from "react";

type ChatAreaProps = {
  greeting: string;
  firstName: string;
};

export default function ChatArea({ greeting, firstName }: ChatAreaProps) {
  const [message, setMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Claude API integration will go here
    setMessage("");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
      {/* Greeting */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
          {greeting}, {firstName}.
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          What would you like to learn today?
        </p>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSend}
        className="w-full max-w-2xl"
      >
        <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!message.trim()}
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
      </form>
    </div>
  );
}
