"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar, { type Course } from "./sidebar";
import CourseChat from "@/app/dashboard/course-chat";

type ActiveSession = {
  course: Course;
  mode: "course" | "assignment" | "quiz";
};

type DashboardShellProps = {
  userName: string;
  userEmail: string;
  avatarUrl: string;
  userId: string;
  children: React.ReactNode;
};

export default function DashboardShell({
  userName,
  userEmail,
  avatarUrl,
  userId,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  const pathname    = usePathname();
  const router      = useRouter();
  const initialized = useRef(false);

  // On first run: restore session from localStorage.
  // On subsequent runs: sync session to localStorage.
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      try {
        const raw = localStorage.getItem("sl_active_session");
        if (raw) setActiveSession(JSON.parse(raw));
      } catch {}
      return;
    }
    if (activeSession) {
      localStorage.setItem("sl_active_session", JSON.stringify(activeSession));
    } else {
      localStorage.removeItem("sl_active_session");
    }
  }, [activeSession]);

  const showCourseChat = activeSession !== null && pathname === "/dashboard";

  const handleSelectCourse = (
    course: Course | null,
    mode: "course" | "assignment" | "quiz"
  ) => {
    setActiveSession(course ? { course, mode } : null);
    router.push("/dashboard");
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f9fb] text-[#070235]">
      {/* Sidebar */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((v) => !v)}
        onSelectCourse={handleSelectCourse}
        activeCourseId={activeSession?.course.id ?? null}
        activeMode={activeSession?.mode ?? null}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {!sidebarOpen && (
          <div className="flex items-center gap-3 border-b border-[#c8c5d0]/50 px-4 py-3 bg-white/80 backdrop-blur-md">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#e3dfff]/50 text-[#787680] hover:text-[#070235] transition-colors"
              title="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#070235] flex items-center justify-center text-[9px] font-bold text-white">
                SL
              </div>
              <span className="font-semibold text-sm text-[#070235]">
                {showCourseChat ? activeSession!.course.name : "StridenexLearn"}
              </span>
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col overflow-hidden bg-[#f7f9fb]">
          {showCourseChat ? (
            <CourseChat
              course={activeSession!.course}
              mode={activeSession!.mode}
              userId={userId}
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}