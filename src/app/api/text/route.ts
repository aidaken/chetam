import { NextResponse } from "next/server";
import { mastra } from "@/mastra";

export const maxDuration = 90;

/**
 * Channel-agnostic text in → text out.
 * iMessage providers (Sendblue/Linq) should POST here.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const text = String(body.text ?? body.message ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  try {
    const agent = mastra.getAgentById("chetam-agent");
    const result = await agent.generate(text, {
      maxSteps: 16,
    });

    return NextResponse.json({
      text: result.text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent failed";
    console.error("[api/text]", message);
    return NextResponse.json(
      {
        error: message,
        text: "I can't reach a model right now. Check /api/health — see MANUAL.md.",
      },
      { status: 502 },
    );
  }
}
