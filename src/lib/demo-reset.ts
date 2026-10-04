import { DEMO_USER_ID } from "@/lib/constants";
import { sql } from "@/lib/db";
import { resetSeededCalendar } from "@/lib/calendar";

/** Expire every pending approval so a fresh scene owns the next "yes". */
export async function expireAllPendingApprovals(userId = DEMO_USER_ID) {
  await sql`
    UPDATE pending_approvals
    SET status = 'expired'
    WHERE user_id = ${userId} AND status = 'pending'
  `;
}

export async function clearActions(userId = DEMO_USER_ID) {
  await sql`DELETE FROM actions WHERE user_id = ${userId}`;
}

export async function getPendingSummary(userId = DEMO_USER_ID): Promise<{
  id: string | null;
  summary: string | null;
  count: number;
}> {
  const rows = await sql`
    SELECT id, bundle
    FROM pending_approvals
    WHERE user_id = ${userId} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!rows[0]) return { id: null, summary: null, count: 0 };
  const bundle = rows[0].bundle as Array<{ summary?: string; type?: string }>;
  const parts = Array.isArray(bundle)
    ? bundle.map((a) => a.summary || a.type || "action").filter(Boolean)
    : [];
  return {
    id: String(rows[0].id),
    summary: parts.length ? parts.join(" · ") : "pending actions",
    count: parts.length,
  };
}

/**
 * Restore demo DB + in-memory calendar to seeded state.
 * Idempotent and fast.
 */
export async function resetDemoState(userId = DEMO_USER_ID) {
  await expireAllPendingApprovals(userId);
  await clearActions(userId);
  await sql`DELETE FROM pending_approvals WHERE user_id = ${userId}`;

  await sql`
    INSERT INTO users (id, name, phone, timezone, home_location)
    VALUES (${userId}, 'Aidar', '+15555550100', 'America/Los_Angeles', 'Home')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  `;

  await sql`DELETE FROM goals WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO goals (user_id, title, metric, target, period) VALUES
    (${userId}, 'Ship the app', NULL, NULL, 'month'),
    (${userId}, 'Weekly active calories', 'active_calories', 2000, 'week'),
    (${userId}, 'Food budget', 'usd', 150, 'month')
  `;

  await sql`DELETE FROM memories WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO memories (user_id, fact, source) VALUES
    (${userId}, 'Dad restores vintage radios', 'mom'),
    (${userId}, 'Dad drinks pour-over coffee', 'user'),
    (${userId}, 'Dad just started growing chili peppers', 'mom'),
    (${userId}, 'Dad birthday gift budget under $60', 'user'),
    (${userId}, 'Dad birthday is Saturday', 'mom'),
    (${userId}, 'Owes Sam the project doc by Friday', 'chat'),
    (${userId}, 'Meeting with Alex at 4 PM at the cafe on Market St', 'chat')
  `;

  await sql`DELETE FROM threads WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO threads (user_id, contact, messages) VALUES
    (
      ${userId},
      'Sam',
      ${JSON.stringify([
        {
          from: "Sam",
          text: "Can you send me the project doc by Friday?",
          at: "yesterday 6:12 PM",
        },
        { from: "Aidar", text: "yep, will do.", at: "yesterday 6:14 PM" },
      ])}::jsonb
    ),
    (
      ${userId},
      'Alex',
      ${JSON.stringify([
        {
          from: "Alex",
          text: "Let's meet at 4 tomorrow at the cafe on Market St.",
          at: "yesterday 9:41 PM",
        },
        {
          from: "Aidar",
          text: "Sounds good, see you there.",
          at: "yesterday 9:43 PM",
        },
      ])}::jsonb
    ),
    (
      ${userId},
      'Mom',
      ${JSON.stringify([
        {
          from: "Mom",
          text: "Don't forget Dad's birthday Saturday. He's been talking about his radio workshop all month.",
          at: "yesterday 8:05 AM",
        },
        {
          from: "Aidar",
          text: "Thanks for the reminder — I'll figure out a gift.",
          at: "yesterday 8:22 AM",
        },
      ])}::jsonb
    )
  `;

  await sql`DELETE FROM fitness_log WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO fitness_log (user_id, date, active_calories, workout) VALUES
    (${userId}, CURRENT_DATE - 6, 250, NULL),
    (${userId}, CURRENT_DATE - 5, 200, NULL),
    (${userId}, CURRENT_DATE - 4, 350, 'gym'),
    (${userId}, CURRENT_DATE - 3, 100, NULL),
    (${userId}, CURRENT_DATE - 2, 100, NULL),
    (${userId}, CURRENT_DATE - 1, 50, NULL),
    (${userId}, CURRENT_DATE, 50, NULL)
  `;

  await sql`
    INSERT INTO demo_state (user_id, location, travel_minutes)
    VALUES (${userId}, 'home', 55)
    ON CONFLICT (user_id) DO UPDATE
    SET location = 'home', travel_minutes = 55, updated_at = now()
  `;

  resetSeededCalendar();

  return { ok: true, travelMinutes: 55 };
}
