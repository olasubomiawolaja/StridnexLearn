# Phase 4 — The Adaptive Engine (build plan)

The AI learns each student per course and adapts: scores answers, tracks weak
areas + level, gets harder/more concise as scores rise, auto-advances through
the scheme of work on mastery, and remembers across sessions.

## Decisions (locked)
- **Route B** — build it inside the existing **Next.js** app. No Python /
  FastAPI / LangGraph. The "agent" is plain orchestration code in `/api` routes.
- **Model: Groq only for now** (existing `GROQ_API_KEY`). No Anthropic key.
  Scoring runs on Groq with defensive JSON parsing. Keep the model call
  swappable so Claude can drop in later if wanted.

## Database
Run once in Supabase → SQL Editor: **`supabase/phase4_adaptive_engine.sql`**
(creates `user_state` + `session_summaries` with row-level security).
Status: ⬜ not yet run.

## Team split (4 devs, but only 1 volunteered so far)
- **Volunteer:** `lib/user-state.ts` (interface below). ✅ assigned
- **Everything else → Claude/me**, built against that interface:
  scoring engine, dynamic adaptive prompt + level progression,
  session summaries, agent loop, mastery → next topic.

## The 8 spec items
1. `user_state` table — scores, weak areas, level, notes *(SQL done; helpers = volunteer)*
2. Scoring call → JSON `{score, correct, weak_concept, mastered}` *(me)*
3. Save state after every interaction *(me, via helpers)*
4. Dynamic system prompt: inject level + weak areas *(me)*
5. Level progression: concise/harder as scores rise *(me)*
6. Session summary saved each chat, read back next session *(me)*
7. Agent loop: state → scheme → prompt → reply → score → update → decide *(me)*
8. Mastery decision → advance to next scheme topic *(me)*

Ship order: helpers/SQL first → scoring + prompts (parallel) → agent loop last.
Keep each piece a small PR.

## Volunteer's task — `lib/user-state.ts`
Pure data-access over the two new tables. Every function takes a Supabase
client first (works server + browser). No LLM calls, no prompt logic.

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type Level = "beginner" | "intermediate" | "advanced";

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

// Read state; if no row yet, return a default (beginner, empty). Do NOT throw.
export function getUserState(
  supabase: SupabaseClient, userId: string, courseId: string
): Promise<UserState>;

// Upsert a partial update. Use onConflict: "user_id,course_id".
export function updateUserState(
  supabase: SupabaseClient, userId: string, courseId: string,
  patch: Partial<Omit<UserState, "userId" | "courseId" | "updatedAt">>
): Promise<void>;

// Merge one topic score into topic_scores; recompute weak_areas (score < 0.5).
export function recordTopicScore(
  supabase: SupabaseClient, userId: string, courseId: string,
  topic: string, score: number
): Promise<void>;

// Append a session summary for a chat mode.
export function saveSessionSummary(
  supabase: SupabaseClient, userId: string, courseId: string,
  mode: "course" | "assignment" | "quiz", summary: string
): Promise<void>;

// Most recent summary for this student+course+mode, or null.
export function getLatestSessionSummary(
  supabase: SupabaseClient, userId: string, courseId: string,
  mode: "course" | "assignment" | "quiz"
): Promise<string | null>;
```
- Map snake_case DB columns ↔ camelCase in the type.

## Also outstanding (separate from Phase 4)
- Phase 1–3 **bug fixes are done & build-verified but NOT committed**
  (API auth + server-side prompts in `app/api/chat/route.ts` + `lib/prompts.ts`;
  honest scheme prompt). Commit when ready.
- `next build` warns `middleware` convention is deprecated (use `proxy`) —
  pre-existing, small separate task.
