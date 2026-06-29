// ── Adaptive engine: per-student, per-course state (Phase 4) ──────────────
//
// Pure data-access over the two tables created by
// `supabase/phase4_adaptive_engine.sql` (`user_state` + `session_summaries`).
// No LLM calls and no prompt logic live here — that's `lib/adaptive.ts`.
//
// Every function takes a Supabase client first so it works from both server
// (route handlers) and browser. DB columns are snake_case; this module maps
// them to/from the camelCase `UserState` shape.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Level = "beginner" | "intermediate" | "advanced";

export type Mode = "course" | "assignment" | "quiz";

export type UserState = {
  userId: string;
  courseId: string;
  currentLevel: Level;
  topicScores: Record<string, number>; // topic -> 0..1 mastery
  weakAreas: string[];
  currentTopic: string | null;
  sessionNotes: string | null;
  updatedAt: string;
};

// A topic counts as "weak" once mastery drops below this.
export const WEAK_THRESHOLD = 0.5;

// ── helpers ────────────────────────────────────────────────────────────────

function defaultState(userId: string, courseId: string): UserState {
  return {
    userId,
    courseId,
    currentLevel: "beginner",
    topicScores: {},
    weakAreas: [],
    currentTopic: null,
    sessionNotes: null,
    updatedAt: new Date(0).toISOString(),
  };
}

// Raw DB row -> camelCase UserState. Tolerant of nulls so a partially-written
// row never throws.
type StateRow = {
  current_level?: string | null;
  topic_scores?: Record<string, number> | null;
  weak_areas?: string[] | null;
  current_topic?: string | null;
  session_notes?: string | null;
  updated_at?: string | null;
};

function rowToState(row: StateRow, userId: string, courseId: string): UserState {
  const base = defaultState(userId, courseId);
  const level = row.current_level;
  return {
    userId,
    courseId,
    currentLevel:
      level === "beginner" || level === "intermediate" || level === "advanced"
        ? level
        : base.currentLevel,
    topicScores: row.topic_scores ?? base.topicScores,
    weakAreas: row.weak_areas ?? base.weakAreas,
    currentTopic: row.current_topic ?? base.currentTopic,
    sessionNotes: row.session_notes ?? base.sessionNotes,
    updatedAt: row.updated_at ?? base.updatedAt,
  };
}

// ── reads ────────────────────────────────────────────────────────────────

// Read state for a course. If the student has no row yet, return a sensible
// default (beginner, empty) — never throws, so callers can use it directly.
export async function getUserState(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<UserState> {
  const { data, error } = await supabase
    .from("user_state")
    .select(
      "current_level, topic_scores, weak_areas, current_topic, session_notes, updated_at"
    )
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !data) return defaultState(userId, courseId);
  return rowToState(data as StateRow, userId, courseId);
}

// ── writes ──────────────────────────────────────────────────────────────

// Upsert a partial update onto the student's state row. Only the provided
// fields are written; the rest keep their existing (or default) values.
export async function updateUserState(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  patch: Partial<Omit<UserState, "userId" | "courseId" | "updatedAt">>
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    course_id: courseId,
    updated_at: new Date().toISOString(),
  };

  if (patch.currentLevel !== undefined) row.current_level = patch.currentLevel;
  if (patch.topicScores !== undefined) row.topic_scores = patch.topicScores;
  if (patch.weakAreas !== undefined) row.weak_areas = patch.weakAreas;
  if (patch.currentTopic !== undefined) row.current_topic = patch.currentTopic;
  if (patch.sessionNotes !== undefined) row.session_notes = patch.sessionNotes;

  const { error } = await supabase
    .from("user_state")
    .upsert(row, { onConflict: "user_id,course_id" });

  if (error) console.error("updateUserState failed:", error.message);
}

// Merge one topic's score into topic_scores and recompute weak_areas
// (a topic is "weak" if its score < WEAK_THRESHOLD). Reads current state
// first so we never clobber other topics.
export async function recordTopicScore(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  topic: string,
  score: number
): Promise<void> {
  const clean = Math.max(0, Math.min(1, score));
  const state = await getUserState(supabase, userId, courseId);

  const topicScores = { ...state.topicScores, [topic]: clean };
  const weakAreas = Object.entries(topicScores)
    .filter(([, s]) => s < WEAK_THRESHOLD)
    .map(([t]) => t);

  await updateUserState(supabase, userId, courseId, { topicScores, weakAreas });
}

// ── session summaries ──────────────────────────────────────────────────

// Append a session summary for a given chat mode.
export async function saveSessionSummary(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  mode: Mode,
  summary: string
): Promise<void> {
  const { error } = await supabase.from("session_summaries").insert({
    user_id: userId,
    course_id: courseId,
    mode,
    summary,
  });

  if (error) console.error("saveSessionSummary failed:", error.message);
}

// Get the most recent session summary for this student+course+mode, or null.
export async function getLatestSessionSummary(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  mode: Mode
): Promise<string | null> {
  const { data, error } = await supabase
    .from("session_summaries")
    .select("summary")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("mode", mode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { summary: string }).summary ?? null;
}
