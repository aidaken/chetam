import { NextResponse } from "next/server";
import {
  forgetMemory,
  getActions,
  getGoals,
  getMemories,
  getUpcomingNudges,
} from "@/lib/data";

export async function GET() {
  const [goals, memories, actions, nudges] = await Promise.all([
    getGoals(),
    getMemories(),
    getActions(),
    getUpcomingNudges(),
  ]);
  return NextResponse.json({ goals, memories, actions, nudges });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const forgotten = await forgetMemory(id);
  return NextResponse.json({ forgotten });
}
