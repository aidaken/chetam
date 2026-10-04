import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";

export const maxDuration = 90;

export async function POST(req: Request) {
  const params = await req.json();
  const stream = await handleChatStream({
    mastra,
    agentId: "chetam-agent",
    version: "v7",
    params,
  });
  return createUIMessageStreamResponse({ stream });
}
