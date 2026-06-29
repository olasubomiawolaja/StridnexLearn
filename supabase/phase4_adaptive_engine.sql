-- ─────────────────────────────────────────────────────────────
-- Phase 4 — The Adaptive Engine
-- Run this once in Supabase → SQL Editor.
--
-- Adds per-student, per-course learning state plus a log of session
-- summaries the tutor reads back at the start of the next session.
-- ─────────────────────────────────────────────────────────────

-- ── 1. user_state ────────────────────────────────────────────
-- One row per (student, course). Holds everything the adaptive
-- engine needs to personalise the next reply.
create table if not exists public.user_state (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,

  -- "beginner" | "intermediate" | "advanced"
  current_level text not null default 'beginner',

  -- map of topic name -> mastery score 0..1, e.g. {"Motion": 0.8, "Forces": 0.4}
  topic_scores  jsonb not null default '{}'::jsonb,

  -- topics the student keeps getting wrong
  weak_areas    text[] not null default '{}',

  -- the scheme topic the student is currently working through
  current_topic text,

  -- short rolling notes the tutor keeps about this student
  session_notes text,

  updated_at    timestamptz not null default now(),

  -- one state row per student per course
  unique (user_id, course_id)
);

-- ── 2. session_summaries ─────────────────────────────────────
-- A short summary saved at the end of each chat. The tutor reads the
-- most recent one when the student returns.
create table if not exists public.session_summaries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,

  -- which chat this summary came from: 'course' | 'assignment' | 'quiz'
  mode       text not null,

  summary    text not null,
  created_at timestamptz not null default now()
);

-- Fast "latest summary for this student+course+mode" lookups.
create index if not exists session_summaries_lookup_idx
  on public.session_summaries (user_id, course_id, mode, created_at desc);

-- ── 3. Row-level security ────────────────────────────────────
-- A student can only ever read/write their OWN rows.
alter table public.user_state        enable row level security;
alter table public.session_summaries enable row level security;

-- Drop-then-create so this whole script is safe to re-run (create policy has
-- no "if not exists"; re-running without these drops would error).

-- user_state policies
drop policy if exists "user_state: select own" on public.user_state;
create policy "user_state: select own"
  on public.user_state for select
  using (auth.uid() = user_id);

drop policy if exists "user_state: insert own" on public.user_state;
create policy "user_state: insert own"
  on public.user_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_state: update own" on public.user_state;
create policy "user_state: update own"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_state: delete own" on public.user_state;
create policy "user_state: delete own"
  on public.user_state for delete
  using (auth.uid() = user_id);

-- session_summaries policies
drop policy if exists "session_summaries: select own" on public.session_summaries;
create policy "session_summaries: select own"
  on public.session_summaries for select
  using (auth.uid() = user_id);

drop policy if exists "session_summaries: insert own" on public.session_summaries;
create policy "session_summaries: insert own"
  on public.session_summaries for insert
  with check (auth.uid() = user_id);

drop policy if exists "session_summaries: delete own" on public.session_summaries;
create policy "session_summaries: delete own"
  on public.session_summaries for delete
  using (auth.uid() = user_id);
