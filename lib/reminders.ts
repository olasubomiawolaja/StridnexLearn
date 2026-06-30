// ── Assignment reminders: "save for later" data access (Phase 3) ─────────────
//
// Pure data-access over the `assignment_reminders` table created by
// `supabase/phase3_assignment_reminders.sql`. Takes a Supabase client first so
// it works from server or browser. DB columns are snake_case; this maps to/from
// the camelCase `Reminder` shape.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ReminderStatus = "pending" | "done";

export type Reminder = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  remindAt: string; // ISO timestamp
  status: ReminderStatus;
  createdAt: string;
};

type ReminderRow = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  remind_at: string;
  status: string | null;
  created_at: string;
};

function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    content: row.content ?? "",
    remindAt: row.remind_at,
    status: row.status === "done" ? "done" : "pending",
    createdAt: row.created_at,
  };
}

// Save an assignment for later. Returns the created reminder, or null on error.
export async function createReminder(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  input: { title: string; content: string; remindAt: string }
): Promise<Reminder | null> {
  const { data, error } = await supabase
    .from("assignment_reminders")
    .insert({
      user_id: userId,
      course_id: courseId,
      title: input.title,
      content: input.content,
      remind_at: input.remindAt,
    })
    .select("id, course_id, title, content, remind_at, status, created_at")
    .single();

  if (error || !data) {
    console.error("createReminder failed:", error?.message);
    return null;
  }
  return rowToReminder(data as ReminderRow);
}

// All reminders for a student+course, soonest first. Never throws.
export async function listReminders(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("assignment_reminders")
    .select("id, course_id, title, content, remind_at, status, created_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("remind_at", { ascending: true });

  if (error || !data) return [];
  return (data as ReminderRow[]).map(rowToReminder);
}

// Flip a reminder between pending/done.
export async function setReminderStatus(
  supabase: SupabaseClient,
  id: string,
  status: ReminderStatus
): Promise<void> {
  const { error } = await supabase
    .from("assignment_reminders")
    .update({ status })
    .eq("id", id);
  if (error) console.error("setReminderStatus failed:", error.message);
}

export async function deleteReminder(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("assignment_reminders")
    .delete()
    .eq("id", id);
  if (error) console.error("deleteReminder failed:", error.message);
}
