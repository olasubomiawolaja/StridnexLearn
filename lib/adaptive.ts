// ── Adaptive engine: the LLM-backed logic (Phase 4) ──────────────────────
//
// This is the "brain" that sits between the chat route and `user-state.ts`:
//   - scoreAnswer:     grade a student's answer -> JSON state delta
//   - summarizeSession: condense a chat into a short recap for next time
//   - computeLevel / parseSchemeTopics / nextSchemeTopic: progression helpers
//
// The model call is isolated in `complete()` so it can be swapped for Claude
// later without touching the rest of the engine — only Groq is wired today.

import type { Level } from "./user-state";
import { scoringPrompt, sessionSummaryPrompt } from "./prompts";

// A topic is considered mastered (and the student advanced past it) at/above
// this score.
export const MASTERY_THRESHOLD = 0.8;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Small + fast: scoring/summarising are background calls, not the main reply.
const MODEL = "llama-3.1-8b-instant";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// The single swappable model call. Returns the assistant text, or "" on any
// failure — callers must treat "" as "no result" and carry on.
async function complete(
  messages: ChatMessage[],
  opts: { maxTokens: number; temperature?: number; json?: boolean }
): Promise<string> {
  if (!process.env.GROQ_API_KEY) return "";
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature ?? 0.2,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

// ── Scoring ────────────────────────────────────────────────────────────

export type AnswerScore = {
  topic: string; // the concept/topic the question was testing
  score: number; // 0..1 mastery shown by this answer
  correct: boolean; // was the answer right?
  weakConcept: string | null; // a specific concept they're shaky on, if any
  mastered: boolean; // does this answer show mastery of the current topic?
};

// Pull the first {...} object out of a model response and parse it. Models
// sometimes wrap JSON in prose or code fences despite instructions — this is
// the defensive layer.
function extractJson(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Grade the student's latest answer to the tutor's last question.
//
// Returns null when there's nothing to score — either the model failed, or
// the student's message wasn't a real answer attempt (a greeting, "ok",
// approving the scheme, etc.). Callers should skip the state update on null.
export async function scoreAnswer(args: {
  courseName: string;
  currentTopic: string | null;
  question: string; // the tutor's last question
  answer: string; // the student's reply being graded
}): Promise<AnswerScore | null> {
  const raw = await complete(
    [
      { role: "system", content: scoringPrompt(args.courseName, args.currentTopic) },
      {
        role: "user",
        content: `TUTOR'S QUESTION:\n${args.question}\n\nSTUDENT'S ANSWER:\n${args.answer}`,
      },
    ],
    { maxTokens: 220, json: true }
  );

  const obj = extractJson(raw) as Record<string, unknown> | null;
  if (!obj) return null;

  // "is_answer" gates everything: false => not a gradable answer => skip.
  if (obj.is_answer === false) return null;

  const scoreNum = typeof obj.score === "number" ? obj.score : Number(obj.score);
  if (!Number.isFinite(scoreNum)) return null;

  const topic =
    typeof obj.topic === "string" && obj.topic.trim()
      ? obj.topic.trim()
      : args.currentTopic;
  if (!topic) return null; // nothing to key the score against

  return {
    topic,
    score: Math.max(0, Math.min(1, scoreNum)),
    correct: obj.correct === true,
    weakConcept:
      typeof obj.weak_concept === "string" && obj.weak_concept.trim()
        ? obj.weak_concept.trim()
        : null,
    mastered: obj.mastered === true,
  };
}

// ── Session summary ──────────────────────────────────────────────────────

// Condense a transcript into a 2-4 sentence recap the tutor reads back at the
// start of the next session. Returns "" if there's nothing usable.
export async function summarizeSession(
  courseName: string,
  mode: "course" | "assignment" | "quiz",
  transcript: string
): Promise<string> {
  if (!transcript.trim()) return "";
  const out = await complete(
    [
      { role: "system", content: sessionSummaryPrompt(courseName, mode) },
      { role: "user", content: transcript },
    ],
    { maxTokens: 200, temperature: 0.3 }
  );
  return out.trim();
}

// ── Progression helpers (pure, no LLM) ───────────────────────────────────

// Overall level from the spread of topic scores. Stays "beginner" until the
// student has a track record, then climbs as their average mastery rises.
export function computeLevel(topicScores: Record<string, number>): Level {
  const scores = Object.values(topicScores);
  if (scores.length === 0) return "beginner";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 0.75) return "advanced";
  if (avg >= 0.45) return "intermediate";
  return "beginner";
}

// Extract the main numbered topics from a freeform scheme of work. Matches
// top-level "1. Topic name" lines and strips any trailing description after a
// colon or dash so the result is a clean topic title.
export function parseSchemeTopics(scheme: string): string[] {
  if (!scheme) return [];
  const topics: string[] = [];
  for (const line of scheme.split("\n")) {
    const m = line.match(/^\s*\d+\.\s+(.+)$/);
    if (!m) continue;
    const title = m[1].replace(/\s*[:\-–—].*$/, "").trim();
    if (title) topics.push(title);
  }
  return topics;
}

// The topic the student should work on next. With no current topic, start at
// the top of the scheme; otherwise return the one after their current topic,
// or null if they've reached the end.
export function nextSchemeTopic(
  scheme: string,
  currentTopic: string | null
): string | null {
  const topics = parseSchemeTopics(scheme);
  if (topics.length === 0) return currentTopic;
  if (!currentTopic) return topics[0];

  const idx = topics.findIndex(
    (t) => t.toLowerCase() === currentTopic.toLowerCase()
  );
  if (idx === -1) return topics[0]; // current topic not in scheme — restart
  return idx + 1 < topics.length ? topics[idx + 1] : null; // null = finished
}
