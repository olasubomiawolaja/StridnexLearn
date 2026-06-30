-- ─────────────────────────────────────────────────────────────
-- Phase 3 — Assignment "save for later" + reminders
-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- When a student chooses to come back to an assignment later, we store it
-- here with a reminder date/time. The dashboard reads these back and shows an
-- "Upcoming assignments" list (in-app only — no email/push).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.assignment_reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,

  -- short label for the assignment (e.g. "Newton's laws problem set")
  title      text not null,
  -- the full assignment text the student saved, so the tutor has it later
  content    text not null default '',

  -- when the student wants to be reminded
  remind_at  timestamptz not null,
  -- 'pending' until the student marks it done
  status     text not null default 'pending',

  created_at timestamptz not null default now()
);

-- Fast "this student's reminders for this course, soonest first" lookups.
create index if not exists assignment_reminders_lookup_idx
  on public.assignment_reminders (user_id, course_id, remind_at);

-- ── Row-level security: a student only ever sees their own reminders ──
alter table public.assignment_reminders enable row level security;

drop policy if exists "assignment_reminders: select own" on public.assignment_reminders;
create policy "assignment_reminders: select own"
  on public.assignment_reminders for select
  using (auth.uid() = user_id);

drop policy if exists "assignment_reminders: insert own" on public.assignment_reminders;
create policy "assignment_reminders: insert own"
  on public.assignment_reminders for insert
  with check (auth.uid() = user_id);

drop policy if exists "assignment_reminders: update own" on public.assignment_reminders;
create policy "assignment_reminders: update own"
  on public.assignment_reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "assignment_reminders: delete own" on public.assignment_reminders;
create policy "assignment_reminders: delete own"
  on public.assignment_reminders for delete
  using (auth.uid() = user_id);
