import { NextResponse } from "next/server";
import { getDemoState } from "@/lib/data";
import {
  expireAllPendingApprovals,
  getPendingSummary,
} from "@/lib/demo-reset";
import { getAlexEmail, getSamEmail } from "@/lib/recipients";
import { mastra } from "@/mastra";

export const maxDuration = 90;

async function morningPrompt() {
  const sam = getSamEmail();
  return `[SYSTEM TRIGGER: morning briefing 7:30 AM] Proactively text Aidar a morning briefing now.
Use tools: get-goals, get-fitness-progress, get-calendar, search-threads for Sam and Alex, find-drive-file for the project doc.
Cover all of: school drop-off (~leave by 7:55), open gym slot 9:30–10:30, weekly active calories shortfall (~900 if ~1100 of 2000) with a catch-up plan, 4 PM with Alex at the cafe on Market St from chat, and the owed project doc to Sam (found in Drive) with a drafted email.

REQUIRED: call propose-actions ONCE with ONE bundle that includes ALL of:
1) create_event — Gym today 9:30–10:30
2) create_event — 30-min brisk walk Thursday evening
3) create_event — Saturday morning workout session
4) reminder — leave for school ~7:55
5) send_email — to ${sam || "(EMAIL_ALLOWLIST Sam)"}, subject about project doc, body with Project Proposal v3 link from Drive

One user "yes" must approve this entire batch. Ask for one yes. Keep the text concise but complete.`;
}

async function leaveNowPrompt() {
  const state = await getDemoState();
  const mins = Number(state.travel_minutes ?? 55);
  const alex = getAlexEmail();
  return `[SYSTEM TRIGGER: leave-now ~3:00 PM] Aidar is still at ${state.location}.
Call get-location and get-travel-time to the cafe on Market St. Travel toggle currently says ${mins} minutes — use that exact number in your message.
Tell him to leave now to arrive around the right time for his 4 PM with Alex.
In the SAME turn, call propose-actions with one send_email action: late notice from "Chetam - assistant to Aidar"${alex ? ` to ${alex}` : ""}, subject like "Running a few minutes late", short body.
Then text a 1–2 line summary that includes the ${mins} minute travel time and ask for yes/send. Do not wait for a second confirmation before proposing.`;
}

const TRIGGERS: Record<
  string,
  { prompt: string | (() => Promise<string> | string) }
> = {
  morning: { prompt: morningPrompt },
  goalblock: {
    prompt:
      "[SYSTEM TRIGGER] Shipping the app is the priority but nothing is blocked for it this week on the calendar. Propose blocking Thursday 2 to 5 for the app via propose-actions. Ask for yes.",
  },
  birthday: {
    prompt: `[SYSTEM TRIGGER] Mom reminded Aidar about Dad's birthday Saturday.
REQUIRED tool calls in order: search-threads("Mom"), get-memories, gift-search.
After gift-search returns, your reply MUST include at least 2 real title + URL lines from the tool results (no placeholders).
Then call propose-actions for: add birthday to calendar Saturday, Friday evening reminder, save gift ideas.
Ask for one yes. Do not invent links.`,
  },
  leavenow: { prompt: leaveNowPrompt },
  trust: {
    prompt:
      "[SYSTEM TRIGGER] User asked what you know about them. Summarize goals, key commitments, and point to the notebook. Keep it to two short lines.",
  },
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const scene = String(body.scene ?? "morning");
  const trigger = TRIGGERS[scene];
  if (!trigger) {
    return NextResponse.json(
      { error: `Unknown scene. Use: ${Object.keys(TRIGGERS).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    // Fresh scene owns the next "yes"
    await expireAllPendingApprovals();

    const prompt =
      typeof trigger.prompt === "function"
        ? await trigger.prompt()
        : trigger.prompt;
    const agent = mastra.getAgentById("chetam-agent");
    const result = await agent.generate(prompt, { maxSteps: 16 });
    const pending = await getPendingSummary();
    return NextResponse.json({ scene, text: result.text, pending });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trigger failed";
    console.error("[api/demo/trigger]", message);
    return NextResponse.json(
      {
        scene,
        error: message,
        text: "Model unavailable — check /api/health and MANUAL.md.",
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ scenes: Object.keys(TRIGGERS) });
}
