import { createClient } from "@/lib/supabase-server";
import ChatArea from "./chat-area";

const GREETINGS = [
  "Welcome back",
  "Ready to learn",
  "Good to see you",
  "Let's get started",
  "What shall we explore today",
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] || "Student";

  // Pick a greeting based on the current hour for variety
  const hour = new Date().getHours();
  const greeting = GREETINGS[hour % GREETINGS.length];

  return <ChatArea greeting={greeting} firstName={firstName} />;
}
