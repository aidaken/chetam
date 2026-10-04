import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  addMemory,
  createPendingApproval,
  forgetMemory,
  getDemoState,
  getFitnessProgress,
  getGoals,
  getLatestPendingApproval,
  getMemories,
  getSpending,
  logAction,
  logSpending,
  markApproval,
  searchThreads,
  setDemoState,
  type ProposedAction,
} from "@/lib/data";
import { createCalendarEvent, getCalendar } from "@/lib/calendar";
import { findDriveFile } from "@/lib/drive";
import { sendEmail } from "@/lib/email";
import { searchDadGifts } from "@/lib/exa";
import { getTravelTime } from "@/lib/integrations";

const AFFIRMATIVE =
  /^(yes|y|yep|yeah|do it|send|approve|ok|okay|sure|go ahead|please)\b/i;

export const getGoalsTool = createTool({
  id: "get-goals",
  description: "Get the user's goals and priorities.",
  inputSchema: z.object({}),
  execute: async () => ({ goals: await getGoals() }),
});

export const getMemoriesTool = createTool({
  id: "get-memories",
  description: "Get everything Chetam currently knows about the user.",
  inputSchema: z.object({}),
  execute: async () => ({ memories: await getMemories() }),
});

export const addMemoryTool = createTool({
  id: "add-memory",
  description: "Remember a new fact about the user.",
  inputSchema: z.object({
    fact: z.string().describe("The fact to remember"),
  }),
  execute: async ({ fact }) => {
    const memory = await addMemory(fact, "user");
    await logAction(
      "memory.add",
      `Remembered: ${fact}`,
      "User asked to remember",
      true,
    );
    return { memory };
  },
});

export const forgetMemoryTool = createTool({
  id: "forget-memory",
  description: "Forget a memory by id (soft delete).",
  inputSchema: z.object({
    id: z.string().describe("Memory id to forget"),
  }),
  execute: async ({ id }) => {
    const forgotten = await forgetMemory(id);
    if (forgotten) {
      await logAction(
        "memory.forget",
        `Forgot: ${forgotten.fact}`,
        "User asked to forget",
        true,
      );
    }
    return { forgotten };
  },
});

export const searchThreadsTool = createTool({
  id: "search-threads",
  description:
    "Search seeded chats with friends/family (Sam, Alex, Mom) for commitments and plans. These are simulated demo threads.",
  inputSchema: z.object({
    query: z.string().describe("Contact name or keyword"),
  }),
  execute: async ({ query }) => ({
    simulated: true,
    threads: await searchThreads(query),
  }),
});

export const getFitnessProgressTool = createTool({
  id: "get-fitness-progress",
  description:
    "Get weekly active calorie progress vs goal. Demo data is seeded/simulated.",
  inputSchema: z.object({}),
  execute: async () => ({
    simulated: true,
    ...(await getFitnessProgress()),
  }),
});

export const getCalendarTool = createTool({
  id: "get-calendar",
  description: "Read calendar events for a range (today/week).",
  inputSchema: z.object({
    range: z.string().default("today").describe("today or week"),
  }),
  execute: async ({ range }) => getCalendar(range),
});

export const findDriveFileTool = createTool({
  id: "find-drive-file",
  description: "Find a file in Google Drive by name/query.",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => findDriveFile(query),
});

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "General web lookup via Exa gift search helper (prefer gift-search for Dad gifts).",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => searchDadGifts({ queryOverride: query }),
});

export const giftSearchTool = createTool({
  id: "gift-search",
  description:
    "Search for niche Dad birthday gifts under $60 using memory interests (vintage radios, chili growing). Returns real Exa title+URL results. Prefer this for birthday gifts.",
  inputSchema: z.object({
    extraHints: z
      .string()
      .optional()
      .describe("Optional extra search hints from the user"),
  }),
  execute: async ({ extraHints }) => {
    return searchDadGifts(
      extraHints?.trim()
        ? {
            queryOverride: `niche gift under $60 for dad who restores vintage radios and grows chili peppers. ${extraHints}`,
          }
        : undefined,
    );
  },
});

export const getLocationTool = createTool({
  id: "get-location",
  description:
    "Get current demo location and travel minutes (Travel selector / simulated).",
  inputSchema: z.object({}),
  execute: async () => {
    const state = await getDemoState();
    return { simulated: true, ...state };
  },
});

export const getTravelTimeTool = createTool({
  id: "get-travel-time",
  description:
    "Estimate travel time from origin to destination. Uses the Travel selector minutes when Maps is unavailable.",
  inputSchema: z.object({
    origin: z.string().default("Home"),
    destination: z.string(),
  }),
  execute: async ({ origin, destination }) => {
    const state = await getDemoState();
    return getTravelTime(origin, destination, Number(state.travel_minutes));
  },
});

export const getSpendingTool = createTool({
  id: "get-spending",
  description: "Get food spending vs monthly budget. Information only.",
  inputSchema: z.object({}),
  execute: async () => ({
    ...(await getSpending()),
    advice: "information_only",
  }),
});

export const logSpendingTool = createTool({
  id: "log-spending",
  description: "Log a spending amount from a text like 'spent $18 on lunch'.",
  inputSchema: z.object({
    merchant: z.string(),
    amount: z.number(),
    category: z.string().default("food"),
  }),
  execute: async ({ merchant, amount, category }) => {
    const spending = await logSpending(merchant, amount, category);
    await logAction(
      "spending.log",
      `Logged $${amount} at ${merchant}`,
      "User reported spending",
      true,
    );
    return spending;
  },
});

export const setDemoLocationTool = createTool({
  id: "set-demo-location",
  description: "Update simulated location/travel time for the leave-now demo.",
  inputSchema: z.object({
    location: z.string(),
    travelMinutes: z.number(),
  }),
  execute: async ({ location, travelMinutes }) => {
    await setDemoState(location, travelMinutes);
    return { location, travelMinutes };
  },
});

export const proposeActionsTool = createTool({
  id: "propose-actions",
  description:
    "REQUIRED before any calendar write, email send, or contacting another person. Propose a bundle of actions and wait for the user to reply yes. Never send email or create calendar events yourself.",
  inputSchema: z.object({
    actions: z.array(
      z.object({
        type: z.enum([
          "create_event",
          "send_email",
          "save_gifts",
          "reminder",
          "other",
        ]),
        summary: z.string(),
        reason: z.string(),
        payload: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
  }),
  execute: async ({ actions }) => {
    const pending = await createPendingApproval(actions as ProposedAction[]);
    for (const action of actions) {
      await logAction(action.type, action.summary, action.reason, false);
    }
    return {
      approvalId: pending.id,
      status: "awaiting_user_yes",
      actions,
      instruction:
        "Text the user a short summary and ask if they want you to do it. Do NOT execute yet.",
    };
  },
});

export const executeApprovedActionsTool = createTool({
  id: "execute-approved-actions",
  description:
    "Run ONLY after the user says yes/send/do it/ok (one-word approvals count). Executes the latest pending approval bundle. This is the ONLY way to send email or create calendar events.",
  inputSchema: z.object({
    confirmation: z
      .string()
      .describe("The user's affirmative reply, e.g. yes"),
  }),
  execute: async ({ confirmation }) => {
    if (!AFFIRMATIVE.test(confirmation.trim())) {
      return { executed: false, reason: "No affirmative confirmation" };
    }

    const pending = await getLatestPendingApproval();
    if (!pending) {
      return { executed: false, reason: "No pending approval found" };
    }

    const results: Array<Record<string, unknown>> = [];
    const bundle = pending.bundle as ProposedAction[];

    for (const action of bundle) {
      if (action.type === "create_event") {
        const payload = action.payload ?? {};
        const event = await createCalendarEvent({
          title: String(payload.title ?? action.summary),
          start: String(payload.start ?? "TBD"),
          end: String(payload.end ?? "TBD"),
          location: payload.location ? String(payload.location) : undefined,
        });
        await logAction(
          "calendar.create",
          action.summary,
          action.reason,
          true,
        );
        results.push({ type: action.type, ...event });
      } else if (action.type === "send_email") {
        const payload = action.payload ?? {};
        const email = await sendEmail({
          to: String(payload.to ?? ""),
          subject: String(payload.subject ?? action.summary),
          text: String(payload.body ?? payload.text ?? action.summary),
        });
        await logAction(
          "email.send",
          action.summary,
          `${action.reason} [${email.mode}${email.reason ? `: ${email.reason}` : ""}]`,
          true,
        );
        results.push({ type: action.type, ...email });
      } else {
        await logAction(action.type, action.summary, action.reason, true);
        results.push({ type: action.type, summary: action.summary, ok: true });
      }
    }

    await markApproval(pending.id, "approved");
    return { executed: true, approvalId: pending.id, results };
  },
});
