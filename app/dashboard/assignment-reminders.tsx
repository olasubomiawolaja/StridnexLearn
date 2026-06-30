"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import {
  createReminder,
  listReminders,
  setReminderStatus,
  deleteReminder,
  type Reminder,
} from "@/lib/reminders";

type Props = {
  courseId: string;
  userId: string;
  // The current assignment text (last thing the student typed/pasted), used to
  // prefill the "save for later" form.
  draftText: string;
};

// A sensible default reminder time: tomorrow at 9am, formatted for a
// <input type="datetime-local"> (which wants local time, no timezone).
function defaultRemindAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AssignmentReminders({ courseId, userId, draftText }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expanded, setExpanded]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle]         = useState("");
  const [remindAt, setRemindAt]   = useState(() => defaultRemindAt());
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // "Now" captured into state when reminders load, so the overdue check below
  // stays pure during render (no Date.now() call while rendering).
  const [now, setNow]             = useState(0);

  // Load this course's reminders on mount / when the course changes. The
  // setState happens after the await (async), and a flag guards against a
  // late response landing after the component switched courses.
  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await listReminders(supabase, userId, courseId);
      if (active) {
        setReminders(rows);
        setNow(Date.now());
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, userId, courseId]);

  const pending = reminders.filter((r) => r.status === "pending");

  const openModal = () => {
    // Prefill the title from the start of the current assignment draft.
    const seed = draftText.trim().replace(/\s+/g, " ").slice(0, 60);
    setTitle(seed || "");
    setRemindAt(defaultRemindAt());
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      setFormError("Give the assignment a short title.");
      return;
    }
    const when = new Date(remindAt);
    if (isNaN(when.getTime())) {
      setFormError("Pick a valid date and time.");
      return;
    }
    setSaving(true);
    const created = await createReminder(supabase, userId, courseId, {
      title: title.trim(),
      content: draftText.trim(),
      remindAt: when.toISOString(),
    });
    setSaving(false);
    if (!created) {
      setFormError("Couldn't save. Please try again.");
      return;
    }
    setReminders((prev) => [...prev, created].sort((a, b) => a.remindAt.localeCompare(b.remindAt)));
    setModalOpen(false);
    setExpanded(true);
  };

  const markDone = async (r: Reminder) => {
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "done" } : x)));
    await setReminderStatus(supabase, r.id, "done");
  };

  const remove = async (r: Reminder) => {
    setReminders((prev) => prev.filter((x) => x.id !== r.id));
    await deleteReminder(supabase, r.id);
  };

  return (
    <div className="mb-3">
      {/* Header row: count + save button */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          disabled={reminders.length === 0}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 disabled:text-gray-300 disabled:cursor-default hover:text-gray-900 transition-colors"
        >
          <span>📌</span>
          {pending.length > 0
            ? `${pending.length} saved for later`
            : reminders.length > 0
            ? "Saved assignments"
            : "No saved assignments yet"}
          {reminders.length > 0 && (
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Save for later
        </button>
      </div>

      {/* Expanded list */}
      {expanded && reminders.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {reminders.map((r) => {
            const overdue = r.status === "pending" && now > 0 && new Date(r.remindAt).getTime() < now;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  r.status === "done" ? "border-gray-100 bg-gray-50 text-gray-400" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${r.status === "done" ? "line-through" : ""}`}>{r.title}</p>
                  <p className={`text-xs ${overdue ? "text-red-500" : "text-gray-400"}`}>
                    {overdue ? "Overdue · " : "Due "}{formatDue(r.remindAt)}
                  </p>
                </div>
                {r.status === "pending" && (
                  <button type="button" onClick={() => markDone(r)} title="Mark done" className="shrink-0 text-gray-400 hover:text-green-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </button>
                )}
                <button type="button" onClick={() => remove(r)} title="Delete" className="shrink-0 text-gray-300 hover:text-red-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Save-for-later modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !saving && setModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-gray-900">Save assignment for later</h3>
            <p className="mb-4 text-xs text-gray-400">We&apos;ll keep it here and remind you when it&apos;s due.</p>

            <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Newton's laws problem set"
              className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <label className="mb-1 block text-xs font-medium text-gray-600">Remind me on</label>
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="mb-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            {!draftText.trim() && (
              <p className="mt-2 text-xs text-amber-600">No assignment text in the box yet — only the title and reminder will be saved.</p>
            )}
            {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-60">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
