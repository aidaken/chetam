import { Mastra } from "@mastra/core/mastra";
import { chetamAgent } from "@/mastra/agents/chetam";

export const mastra = new Mastra({
  agents: { chetamAgent },
});
