import { NextResponse } from "next/server";
import { getPendingSummary } from "@/lib/demo-reset";

export async function GET() {
  return NextResponse.json(await getPendingSummary());
}
