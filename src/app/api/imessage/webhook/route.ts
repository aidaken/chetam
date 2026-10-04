import { NextResponse } from "next/server";

/**
 * Thin iMessage webhook adapter.
 * Wire Sendblue/Linq to POST here; we forward to /api/text.
 */
export async function POST(req: Request) {
  const payload = await req.json();
  const text =
    payload.content ??
    payload.message ??
    payload.text ??
    payload.body ??
    "";
  const from =
    payload.from_number ?? payload.from ?? payload.sender ?? "unknown";

  if (!text) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from }),
  });
  const data = await res.json();

  if (
    process.env.SENDBLUE_API_KEY &&
    process.env.SENDBLUE_API_SECRET &&
    process.env.SENDBLUE_FROM_NUMBER &&
    data.text
  ) {
    await fetch("https://api.sendblue.co/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "sb-api-key-id": process.env.SENDBLUE_API_KEY,
        "sb-api-secret-key": process.env.SENDBLUE_API_SECRET,
      },
      body: JSON.stringify({
        number: from,
        from_number: process.env.SENDBLUE_FROM_NUMBER,
        content: data.text,
      }),
    });
  }

  return NextResponse.json({ ok: true, reply: data.text ?? null });
}
