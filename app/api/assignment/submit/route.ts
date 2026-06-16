import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { content, course_name } = await req.json();

  const opening = `I've received your assignment!\n\n"${content}"\n\nWould you like to go through this **now**, or come back to it **later**?`;

  return NextResponse.json({ message: opening });
}