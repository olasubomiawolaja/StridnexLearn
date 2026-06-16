import { buildSocraticPrompt } from "@/lib/prompt/assignment_prompt";
import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

export async function POST(req: NextRequest) {
  const { subject, assignment, history, user_message } = await req.json();

  const lower = user_message.toLowerCase();
  const isLater = ["later", "remind", "come back", "not now", "save"].some(w => lower.includes(w));

  if (isLater) {
    return NextResponse.json({ 
      message: "No problem! When would you like me to remind you? Just send me a date and time.",
      mode: "set_reminder" 
    });
  }

  const systemPrompt = buildSocraticPrompt(subject, assignment);

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: user_message },
      ],
    }),
  });

  const data = await res.json();
  const reply = data.choices[0].message.content;

  return NextResponse.json({ message: reply, mode: "socratic" });
}