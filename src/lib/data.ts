import { DEMO_USER_ID } from "@/lib/constants";
import { sql } from "@/lib/db";

export type Goal = {
  id: string;
  title: string;
  metric: string | null;
  target: number | null;
  period: string | null;
};

export type Memory = {
  id: string;
  fact: string;
  source: string;
  created_at: string;
};

export type Thread = {
  id: string;
  contact: string;
  messages: Array<{ from: string; text: string; at: string }>;
};

export type ActionRow = {
  id: string;
  type: string;
  summary: string;
  reason: string;
  approved: boolean;
  created_at: string;
};

export type PendingApproval = {
  id: string;
  bundle: ProposedAction[];
  status: string;
};

export type ProposedAction = {
  type: string;
  summary: string;
  reason: string;
  payload?: Record<string, unknown>;
};

export type Nudge = {
  id: string;
  title: string;
  when: string;
  reason: string;
};

/** Ensure core tables exist (idempotent). */
export async function ensureSchema() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      phone TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
      home_location TEXT NOT NULL DEFAULT 'Home',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      metric TEXT,
      target NUMERIC,
      period TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      fact TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted BOOLEAN NOT NULL DEFAULT false
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS threads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact TEXT NOT NULL,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS fitness_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      active_calories INTEGER NOT NULL DEFAULT 0,
      workout TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      reason TEXT NOT NULL,
      approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS pending_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bundle JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS demo_state (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      location TEXT NOT NULL DEFAULT 'home',
      travel_minutes INTEGER NOT NULL DEFAULT 55,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      merchant TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      category TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

export async function getGoals(userId = DEMO_USER_ID): Promise<Goal[]> {
  return (await sql`
    SELECT id, title, metric, target, period
    FROM goals
    WHERE user_id = ${userId}
    ORDER BY created_at
  `) as Goal[];
}

export async function getMemories(userId = DEMO_USER_ID): Promise<Memory[]> {
  return (await sql`
    SELECT id, fact, source, created_at
    FROM memories
    WHERE user_id = ${userId} AND deleted = false
    ORDER BY created_at DESC
  `) as Memory[];
}

export async function addMemory(
  fact: string,
  source = "user",
  userId = DEMO_USER_ID,
) {
  const rows = await sql`
    INSERT INTO memories (user_id, fact, source)
    VALUES (${userId}, ${fact}, ${source})
    RETURNING id, fact, source, created_at
  `;
  return rows[0] as Memory;
}

export async function forgetMemory(id: string, userId = DEMO_USER_ID) {
  const rows = await sql`
    UPDATE memories
    SET deleted = true
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, fact
  `;
  return rows[0] ?? null;
}

export async function searchThreads(
  query: string,
  userId = DEMO_USER_ID,
): Promise<Thread[]> {
  const q = `%${query.toLowerCase()}%`;
  return (await sql`
    SELECT id, contact, messages
    FROM threads
    WHERE user_id = ${userId}
      AND (
        lower(contact) LIKE ${q}
        OR lower(messages::text) LIKE ${q}
      )
    ORDER BY contact
  `) as Thread[];
}

export async function getAllThreads(userId = DEMO_USER_ID): Promise<Thread[]> {
  return (await sql`
    SELECT id, contact, messages
    FROM threads
    WHERE user_id = ${userId}
    ORDER BY contact
  `) as Thread[];
}

export async function getFitnessProgress(userId = DEMO_USER_ID) {
  const rows = await sql`
    SELECT
      COALESCE(SUM(active_calories), 0)::int AS total_calories,
      MAX(CASE WHEN workout IS NOT NULL THEN date END) AS last_workout
    FROM fitness_log
    WHERE user_id = ${userId}
      AND date >= CURRENT_DATE - INTERVAL '6 days'
  `;
  const goals = await getGoals(userId);
  const calorieGoal = goals.find((g) => g.metric === "active_calories");
  const total = Number(rows[0]?.total_calories ?? 0);
  const target = Number(calorieGoal?.target ?? 2000);
  const lastWorkout = rows[0]?.last_workout
    ? String(rows[0].last_workout)
    : null;
  let daysSinceWorkout: number | null = null;
  if (lastWorkout) {
    const last = new Date(lastWorkout);
    daysSinceWorkout = Math.floor(
      (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
  return {
    totalCalories: total,
    target,
    shortfall: Math.max(target - total, 0),
    lastWorkout,
    daysSinceWorkout,
    daysLeftInWeek: 4,
  };
}

export async function getDemoState(userId = DEMO_USER_ID) {
  const rows = await sql`
    SELECT location, travel_minutes, updated_at
    FROM demo_state
    WHERE user_id = ${userId}
  `;
  return (
    rows[0] ?? {
      location: "home",
      travel_minutes: 55,
      updated_at: new Date().toISOString(),
    }
  );
}

export async function setDemoState(
  location: string,
  travelMinutes: number,
  userId = DEMO_USER_ID,
) {
  await sql`
    INSERT INTO demo_state (user_id, location, travel_minutes, updated_at)
    VALUES (${userId}, ${location}, ${travelMinutes}, now())
    ON CONFLICT (user_id) DO UPDATE
    SET location = EXCLUDED.location,
        travel_minutes = EXCLUDED.travel_minutes,
        updated_at = now()
  `;
}

export async function logAction(
  type: string,
  summary: string,
  reason: string,
  approved = true,
  userId = DEMO_USER_ID,
) {
  const rows = await sql`
    INSERT INTO actions (user_id, type, summary, reason, approved)
    VALUES (${userId}, ${type}, ${summary}, ${reason}, ${approved})
    RETURNING id, type, summary, reason, approved, created_at
  `;
  return rows[0] as ActionRow;
}

export async function getActions(userId = DEMO_USER_ID): Promise<ActionRow[]> {
  return (await sql`
    SELECT id, type, summary, reason, approved, created_at
    FROM actions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `) as ActionRow[];
}

export async function createPendingApproval(
  bundle: ProposedAction[],
  userId = DEMO_USER_ID,
) {
  const rows = await sql`
    INSERT INTO pending_approvals (user_id, bundle, status)
    VALUES (${userId}, ${JSON.stringify(bundle)}::jsonb, 'pending')
    RETURNING id, bundle, status
  `;
  return rows[0] as PendingApproval;
}

export async function getLatestPendingApproval(
  userId = DEMO_USER_ID,
): Promise<PendingApproval | null> {
  const rows = await sql`
    SELECT id, bundle, status
    FROM pending_approvals
    WHERE user_id = ${userId} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as PendingApproval) ?? null;
}

export async function markApproval(
  id: string,
  status: "approved" | "rejected",
  userId = DEMO_USER_ID,
) {
  await sql`
    UPDATE pending_approvals
    SET status = ${status}
    WHERE id = ${id} AND user_id = ${userId}
  `;
}

export async function getSpending(userId = DEMO_USER_ID) {
  const rows = await sql`
    SELECT COALESCE(SUM(amount), 0)::float AS spent
    FROM transactions
    WHERE user_id = ${userId}
      AND category = 'food'
      AND date >= date_trunc('month', CURRENT_DATE)
  `;
  return {
    spent: Number(rows[0]?.spent ?? 0),
    budget: 150,
  };
}

export async function logSpending(
  merchant: string,
  amount: number,
  category = "food",
  userId = DEMO_USER_ID,
) {
  await sql`
    INSERT INTO transactions (user_id, date, merchant, amount, category)
    VALUES (${userId}, CURRENT_DATE, ${merchant}, ${amount}, ${category})
  `;
  return getSpending(userId);
}

/** Upcoming nudges derived from goals, calendar seed, and pending approvals. */
export async function getUpcomingNudges(
  userId = DEMO_USER_ID,
): Promise<Nudge[]> {
  const [fitness, pending, demo] = await Promise.all([
    getFitnessProgress(userId),
    getLatestPendingApproval(userId),
    getDemoState(userId),
  ]);
  const nudges: Nudge[] = [
    {
      id: "nudge-dropoff",
      title: "Leave for school drop-off",
      when: "Today ~7:55 AM",
      reason: "8:15 school drop-off on calendar",
    },
    {
      id: "nudge-alex",
      title: "Leave for Alex (Market St cafe)",
      when: `Based on ${demo.travel_minutes} min travel`,
      reason: "4 PM meeting; travel from demo location toggle",
    },
  ];
  if (fitness.shortfall > 0) {
    nudges.push({
      id: "nudge-fitness",
      title: `Catch up ${fitness.shortfall} active calories`,
      when: "This week",
      reason: `${fitness.totalCalories} of ${fitness.target} logged`,
    });
  }
  if (pending) {
    nudges.push({
      id: "nudge-approval",
      title: "Pending approval bundle",
      when: "Waiting on your yes",
      reason: `${(pending.bundle as ProposedAction[]).length} proposed action(s)`,
    });
  }
  return nudges;
}

export async function pingDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    await sql`SELECT 1 AS ok`;
    return { ok: true };
  } catch (error) {
    console.error("[db] ping failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "DB ping failed",
    };
  }
}
