import { NextResponse } from "next/server";
import { resetDemoState } from "@/lib/demo-reset";
import { getDemoRecipients } from "@/lib/recipients";

export async function POST() {
  const result = await resetDemoState();
  return NextResponse.json({
    ...result,
    recipients: getDemoRecipients(),
    chatCleared: true,
  });
}
