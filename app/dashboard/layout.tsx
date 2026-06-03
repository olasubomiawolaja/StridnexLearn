import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile from database
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "Student";

  const userEmail = user.email || "";
  const avatarUrl = profile?.avatar_url || "";

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      avatarUrl={avatarUrl}
      userId={user.id}        // ← new
    >
      {children}
    </DashboardShell>
  );
}