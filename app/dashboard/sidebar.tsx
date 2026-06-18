"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────
export type Course = {
  id: string;
  name: string;
  description?: string;
};

function SectionIcon({ kind }: { kind: "course" | "assignment" | "quiz" }) {
  const common = "w-4 h-4 shrink-0";

  if (kind === "assignment") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6M7 4h5.5a2 2 0 011.414.586l4.5 4.5A2 2 0 0119 10.5V20a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    );
  }

  if (kind === "quiz") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M9.09 9a3 3 0 115.82 1c0 2-3 2-3 5M4 12a8 8 0 1116 0 8 8 0 01-16 0z" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5A2.5 2.5 0 016.5 4H9a2 2 0 011.414.586l1.586 1.586A2 2 0 0013 7h4.5A2.5 2.5 0 0120 9.5v8A2.5 2.5 0 0117.5 20h-11A2.5 2.5 0 014 17.5v-11z" />
    </svg>
  );
}

type SidebarProps = {
  userName: string;
  userEmail: string;
  avatarUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onSelectCourse: (course: Course | null, mode: "course" | "assignment" | "quiz") => void;
  activeCourseId?: string | null;
  activeMode?: "course" | "assignment" | "quiz" | null;
};

// ── Course Modal ───────────────────────────────────────────
function AddCourseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  // Returns an error string on failure, null on success
  onAdd: (name: string, description: string) => Promise<string | null>;
}) {
  const [name, setName]       = useState("");
  const [description, setDesc] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    const err = await onAdd(name.trim(), description.trim());
    setSaving(false);
    if (err) {
      // Stay open and show the error inside the modal
      setError(err);
      return;
    }
    // Only close when the course was actually created
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 border border-[#c8c5d0]/40">
        <h2 className="text-lg font-bold text-[#070235] mb-1">Create a new course</h2>
        <p className="text-sm text-[#47464f] mb-5">
          Give your course a name. Assignments and quizzes will be set up automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5b598c] mb-1.5">
              Course name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Physics, Mathematics, Biology"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4e45d5] focus:border-transparent placeholder:text-[#787680] transition-colors ${
                error ? "border-red-400 bg-red-50" : "border-[#c8c5d0]/60"
              }`}
            />
            {/* Inline error — shown right under the input for immediate feedback */}
            {error && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5b598c] mb-1.5">
              Description <span className="text-[#787680] font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description of this course"
              rows={2}
              className="w-full px-3.5 py-2.5 border border-[#c8c5d0]/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4e45d5] focus:border-transparent placeholder:text-[#787680] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#47464f] hover:text-[#070235] hover:bg-[#e3dfff]/30 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-5 py-2.5 text-sm font-medium bg-[#4e45d5] text-white rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Creating..." : "Create course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dropdown Section ───────────────────────────────────────
function DropdownSection({
  label,
  courses,
  activeCourseId,
  activeMode,
  mode,
  onSelectCourse,
  showAddCourse,
  onAddCourse,
  onDeleteCourse,
}: {
  label: string;
  courses: Course[];
  activeCourseId?: string | null;
  activeMode?: "course" | "assignment" | "quiz" | null;
  mode: "course" | "assignment" | "quiz";
  onSelectCourse: (course: Course, mode: "course" | "assignment" | "quiz") => void;
  showAddCourse?: boolean;
  onAddCourse?: () => void;
  onDeleteCourse?: (id: string) => Promise<void>;
}) {
  const [open, setOpen]             = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#070235] hover:bg-[#e3dfff]/40 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold">
          <SectionIcon kind={mode} />
          {label}
        </span>
        <svg
          className={`w-4 h-4 text-[#787680] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">

          {/* + Add Course — only on Courses section */}
          {showAddCourse && (
            <button
              onClick={onAddCourse}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#4e45d5] hover:bg-[#e3dfff]/50 rounded-md font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Course
            </button>
          )}

          {/* Course list */}
          {courses.length === 0 ? (
            <p className="text-xs text-[#787680] px-3 py-1.5 italic">
              {mode === "course" ? "No courses yet — add one above" : "No courses yet"}
            </p>
          ) : (
            courses.map((course) => {
              const isActive = activeCourseId === course.id && activeMode === mode;
              return (
                <div key={course.id} className="relative flex items-center group">
                  <button
                    onClick={() => onSelectCourse(course, mode)}
                    className={`flex-1 text-left px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 pr-8 ${
                      isActive
                        ? "bg-[#4e45d5] text-white"
                        : "text-[#47464f] hover:bg-[#e3dfff]/40 hover:text-[#070235]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                    <span className="truncate">{course.name}</span>
                  </button>

                  {/* Three dots — only on Courses section */}
                  {mode === "course" && onDeleteCourse && (
                    <div className="absolute right-1" ref={menuOpenId === course.id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === course.id ? null : course.id);
                        }}
                        className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                          isActive
                            ? "text-white/60 hover:text-white hover:bg-white/10"
                            : "text-[#787680] hover:text-[#070235] hover:bg-[#e3dfff]/50 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>

                      {/* Dropdown menu */}
                      {menuOpenId === course.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              await onDeleteCourse(course.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────
export default function Sidebar({
  userName,
  userEmail,
  avatarUrl,
  isOpen,
  onClose,
  onToggle,
  onSelectCourse,
  activeCourseId,
  activeMode,
}: SidebarProps) {
  const [showProfile, setShowProfile]       = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [courses, setCourses]               = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError]       = useState("");
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // ── Load courses ───────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (!error && data) setCourses(data);
      setLoadingCourses(false);
    };
    fetch_();
  }, [supabase]);

  // ── Add course ─────────────────────────────────────────
  // Returns an error string on failure, null on success.
  // The modal uses this return value to decide whether to close.
  const handleAddCourse = async (
    name: string,
    description: string
  ): Promise<string | null> => {
    setCourseError("");

    // ── Duplicate check (case-insensitive, trimmed) ──────
    // "Physics" == "physics" == "PHYSICS" → blocked
    // "Physics" vs "Physics 101"          → allowed (different strings)
    const isDuplicate = courses.some(
      (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      return `Course "${name}" already exists.`;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return "You need to be signed in to create a course.";
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({ name, description, user_id: user.id })
      .select("id, name, description")
      .single();

    if (error) {
      return error.message;
    }

    if (data) setCourses((prev) => [...prev, data]);
    return null; // success
  };

  // ── Delete course ──────────────────────────────────────
  // Cascade delete in DB handles chat_messages automatically
  const handleDeleteCourse = async (id: string) => {
    setCourseError("");
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      setCourseError(error.message);
      return;
    }

    setCourses((prev) => prev.filter((c) => c.id !== id));
    // If the deleted course was active, go back to home
    if (activeCourseId === id) onSelectCourse(null, "course");
  };

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#070235]/30 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed md:relative z-50 md:z-auto h-screen bg-[#f7f9fb] border-r border-[#c8c5d0]/50 flex flex-col shrink-0 transition-all duration-300 overflow-hidden ${
          isOpen ? "w-64 translate-x-0" : "w-0 md:w-0 -translate-x-full md:translate-x-0"
        }`}
      >
        <div className="w-64 flex flex-col h-full">

          {/* ── Top bar: logo + toggle ── */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#070235] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                SL
              </div>
              <span className="font-semibold text-sm text-[#070235]">StridenexLearn</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-[#e3dfff]/50 text-[#787680] hover:text-[#070235] transition-colors"
              title="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h7M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-3 pb-2">
            <button
              onClick={() => onSelectCourse(null, "course")}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#070235] text-white text-sm font-medium rounded-lg hover:brightness-110 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
            {courseError && (
              <p className="mx-2 mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {courseError}
              </p>
            )}

            {loadingCourses ? (
              <div className="px-3 py-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <DropdownSection
                  label="Courses"
                  courses={courses}
                  activeCourseId={activeCourseId}
                  activeMode={activeMode}
                  mode="course"
                  onSelectCourse={onSelectCourse}
                  showAddCourse={true}
                  onAddCourse={() => setShowModal(true)}
                  onDeleteCourse={handleDeleteCourse}
                />
                <DropdownSection
                  label="Assignment"
                  courses={courses}
                  activeCourseId={activeCourseId}
                  activeMode={activeMode}
                  mode="assignment"
                  onSelectCourse={onSelectCourse}
                />
                <DropdownSection
                  label="Quiz"
                  courses={courses}
                  activeCourseId={activeCourseId}
                  activeMode={activeMode}
                  mode="quiz"
                  onSelectCourse={onSelectCourse}
                />
              </>
            )}
          </nav>

          {/* User Profile */}
          <div className="relative border-t border-gray-100 p-3">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#e3dfff]/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#070235] shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-white">{initials}</span>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-[#070235] truncate">{userName}</p>
                <p className="text-xs text-[#787680] truncate">{userEmail}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-[#c8c5d0]/50 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => { setShowProfile(false); router.push("/dashboard/profile"); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#47464f] hover:bg-[#e3dfff]/40"
                >
                  Profile Settings
                </button>
                <button
                  onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-[#c8c5d0]/40"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Add Course Modal */}
      {showModal && (
        <AddCourseModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddCourse}
        />
      )}
    </>
  );
}