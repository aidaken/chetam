import { NextResponse } from "next/server";
import { pingDb } from "@/lib/data";
import { pingAgentMail } from "@/lib/email";
import { pingExa } from "@/lib/exa";
import { pingLlm } from "@/lib/llm";

export const maxDuration = 60;

export async function GET() {
  const [llm, exa, agentmail, db] = await Promise.all([
    pingLlm(),
    pingExa(),
    pingAgentMail(),
    pingDb(),
  ]);

  const checks = {
    llm,
    exa,
    agentmail,
    db,
  };

  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      ok,
      checks,
      model: process.env.LLM_MODEL?.trim() || "gpt-5-mini",
      emailEnabled: process.env.EMAIL_ENABLED?.trim() === "true",
      // never include secrets
    },
    { status: ok ? 200 : 503 },
  );
}
