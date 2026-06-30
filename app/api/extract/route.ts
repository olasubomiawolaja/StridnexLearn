// ── File extraction for assignment uploads (Phase 3) ─────────────────────────
//
// Students can attach an assignment as a file instead of typing it. The browser
// posts the raw file here; we pull plain text out of it and hand the text back,
// which the client drops into the chat input so the student can review and send
// it like any other assignment.
//
// Supported: text-like files (decoded directly), PDFs (text extracted with
// pdfjs-dist), and images/photos (transcribed by a Groq vision model). Anything
// we can't read returns a friendly error rather than throwing.

import { createClient } from "@/lib/supabase-server";

// pdfjs needs Node APIs; keep this handler off the edge runtime.
export const runtime = "nodejs";

// Raw upload cap. Groq's vision endpoint allows 20MB per request, and base64
// inflates by ~33%, so 10MB raw stays comfortably under that for images.
const MAX_BYTES = 10 * 1024 * 1024;
// Don't feed an unbounded wall of text into the tutor prompt.
const MAX_CHARS = 20_000;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function isTextLike(name: string, type: string): boolean {
  if (type.startsWith("text/")) return true;
  if (type === "application/json" || type === "application/rtf") return true;
  return /\.(txt|md|markdown|csv|tsv|rtf|json|log)$/i.test(name);
}

// Extract text from a PDF without rendering it. getTextContent doesn't need a
// canvas, so this runs fine server-side.
async function extractPdf(buf: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    if (line.trim()) parts.push(line);
  }
  await doc.cleanup();
  return parts.join("\n");
}

// Transcribe an image (photo of handwritten/printed work) to text via Groq's
// vision model. Returns "" on any failure so the caller can report cleanly.
async function transcribeImage(buf: Buffer, mime: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) return "";
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is a photo of a student's assignment. Transcribe ALL the assignment text (questions, instructions, numbering) exactly as written. Output only the transcribed text — no commentary. If there is no readable text, reply with exactly: NO_TEXT_FOUND",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const out: string = data?.choices?.[0]?.message?.content ?? "";
    return out.trim() === "NO_TEXT_FOUND" ? "" : out.trim();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  // Same auth gate as the chat route — only signed-in users, so the vision
  // model can't be run anonymously on our key.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "File is too large (max 10MB)." },
      { status: 413 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name || "upload";
  const type = file.type || "";

  let text = "";
  try {
    if (type.startsWith("image/")) {
      text = await transcribeImage(buf, type);
      if (!text) {
        return Response.json(
          { error: "Couldn't read any text from that image. Try a clearer photo." },
          { status: 422 }
        );
      }
    } else if (type === "application/pdf" || /\.pdf$/i.test(name)) {
      text = await extractPdf(buf);
      if (!text.trim()) {
        return Response.json(
          {
            error:
              "That PDF has no selectable text (it may be scanned). Upload a photo of it instead and I'll read it.",
          },
          { status: 422 }
        );
      }
    } else if (isTextLike(name, type)) {
      text = buf.toString("utf-8");
    } else {
      // Last resort: try to decode as text; reject if it looks binary (a NUL
      // byte is a reliable "this isn't text" signal).
      const decoded = buf.toString("utf-8");
      if (!decoded || decoded.includes("\u0000")) {
        return Response.json(
          { error: `Unsupported file type${type ? ` (${type})` : ""}. Try a PDF, image, or text file.` },
          { status: 415 }
        );
      }
      text = decoded;
    }
  } catch (err) {
    console.error("extract failed:", err);
    return Response.json(
      { error: "Couldn't read that file. Try a different format." },
      { status: 500 }
    );
  }

  text = text.replace(/\r\n/g, "\n").trim();
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n…(truncated)";
  if (!text) {
    return Response.json({ error: "No readable text found." }, { status: 422 });
  }

  return Response.json({ text, filename: name });
}
