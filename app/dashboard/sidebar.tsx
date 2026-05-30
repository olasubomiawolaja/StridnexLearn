"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type SidebarProps = {
  userName: string;
  userEmail: string;
  avatarUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

function DropdownSection({
  label,
  courses,
}: {
  label: string;
  courses: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <span className="font-medium">{label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="ml-3 mt-1 space-y-0.5">
          {courses.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-1.5">
              No courses yet
            </p>
          ) : (
            courses.map((course) => (
              <button
                key={course}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                {course}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ userName, userEmail, avatarUrl, isOpen, onClose }: SidebarProps) {
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  // Placeholder — courses will come from Supabase later
  const courses: string[] = [];

  const recentChats: string[] = [];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative z-50 md:z-auto w-64 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      {/* New Chat Button */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        <DropdownSection label="Courses" courses={courses} />
        <DropdownSection label="Assignment" courses={courses} />
        <DropdownSection label="Quiz" courses={courses} />

        {/* Recent Chats */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Recent Chats
          </p>
          {recentChats.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-1.5">
              No chats yet — start a conversation!
            </p>
          ) : (
            recentChats.map((chat) => (
              <button
                key={chat}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                {chat}
              </button>
            ))
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="relative border-t border-gray-100 p-3">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50"
        >
          
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-900 shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-white">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            )}
          </div>

          <div className="text-left min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
        </button>

        {showProfile && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => {
                setShowProfile(false);
                router.push("/dashboard/profile");
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
            >
              Log out
            </button>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}
