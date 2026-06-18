import { createClient } from "@/lib/supabase-server";
import ChatArea from "./chat-area";

const MORNING_GREETINGS = [
  "Good morning",
  "Morning, ready to learn",
  "Good morning, let's start strong",
  "Ready for a fresh start",
  "What shall we explore this morning",
  "Morning, let's build some momentum",
  "Good morning, time to grow",
  "A new day, a new lesson",
  "Morning, let's sharpen your skills",
  "Ready to make progress today",
];

const AFTERNOON_GREETINGS = [
  "Good afternoon",
  "Ready for an afternoon session",
  "Good afternoon, let's keep going",
  "What shall we explore this afternoon",
  "Hope your day is going well",
  "Afternoon focus time",
  "Let's continue learning",
  "Good afternoon, ready to make progress",
  "A little learning goes a long way",
  "Let's turn this afternoon into progress",
];

const EVENING_GREETINGS = [
  "Good evening",
  "Ready for an evening study session",
  "Good evening, let's review something useful",
  "What shall we explore tonight",
  "Let's wind down with some learning",
  "Evening focus mode",
  "Good evening, ready to learn",
  "Let's finish the day with progress",
  "Tonight is a good time to grow",
  "Ready to wrap the day with something new",
];

const NIGHT_GREETINGS = [
  "Still learning tonight",
  "Late-night study mode",
  "Ready for a quiet learning session",
  "What shall we explore before you rest",
  "Let's make this night productive",
  "Night focus mode",
  "A calm time to learn something new",
  "Let's do a little more before the day ends",
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] || "Student";

  const hour = new Date().getHours();

  let greetings = MORNING_GREETINGS;

  if (hour >= 5 && hour < 12) {
    greetings = MORNING_GREETINGS;
  } else if (hour >= 12 && hour < 17) {
    greetings = AFTERNOON_GREETINGS;
  } else if (hour >= 17 && hour < 21) {
    greetings = EVENING_GREETINGS;
  } else {
    greetings = NIGHT_GREETINGS;
  }

  const greeting = greetings[hour % greetings.length];

  return <ChatArea greeting={greeting} firstName={firstName} />;
}