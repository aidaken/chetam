import { NextResponse } from "next/server";
import { getDemoState, setDemoState } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getDemoState());
}

export async function POST(req: Request) {
  const body = await req.json();
  const location = String(body.location ?? "home");
  const travelMinutes = Number(body.travelMinutes ?? 55);
  await setDemoState(location, travelMinutes);
  return NextResponse.json(await getDemoState());
}
