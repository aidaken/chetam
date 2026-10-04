/**
 * Idempotent demo seed for Chetam.
 * Usage: bun run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const USER_ID = process.env.DEMO_USER_ID ?? "11111111-1111-1111-1111-111111111111";

async function ensureSchema() {
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

async function seed() {
  await ensureSchema();

  await sql`
    INSERT INTO users (id, name, phone, timezone, home_location)
    VALUES (${USER_ID}, 'Aidar', '+15555550100', 'America/Los_Angeles', 'Home')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  `;

  // Goals — delete+reinsert for this user to stay idempotent and exact
  await sql`DELETE FROM goals WHERE user_id = ${USER_ID}`;
  await sql`
    INSERT INTO goals (user_id, title, metric, target, period) VALUES
    (${USER_ID}, 'Ship the app', NULL, NULL, 'month'),
    (${USER_ID}, 'Weekly active calories', 'active_calories', 2000, 'week'),
    (${USER_ID}, 'Food budget', 'usd', 150, 'month')
  `;

  await sql`DELETE FROM memories WHERE user_id = ${USER_ID}`;
  await sql`
    INSERT INTO memories (user_id, fact, source) VALUES
    (${USER_ID}, 'Dad restores vintage radios', 'mom'),
    (${USER_ID}, 'Dad drinks pour-over coffee', 'user'),
    (${USER_ID}, 'Dad just started growing chili peppers', 'mom'),
    (${USER_ID}, 'Dad birthday gift budget under $60', 'user'),
    (${USER_ID}, 'Dad birthday is Saturday', 'mom'),
    (${USER_ID}, 'Owes Sam the project doc by Friday', 'chat'),
    (${USER_ID}, 'Meeting with Alex at 4 PM at the cafe on Market St', 'chat')
  `;

  await sql`DELETE FROM threads WHERE user_id = ${USER_ID}`;
  await sql`
    INSERT INTO threads (user_id, contact, messages) VALUES
    (
      ${USER_ID},
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
      ${USER_ID},
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
      ${USER_ID},
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

  // Fitness: 1,100 of 2,000; last workout 4 days ago
  await sql`DELETE FROM fitness_log WHERE user_id = ${USER_ID}`;
  await sql`
    INSERT INTO fitness_log (user_id, date, active_calories, workout) VALUES
    (${USER_ID}, CURRENT_DATE - 6, 250, NULL),
    (${USER_ID}, CURRENT_DATE - 5, 200, NULL),
    (${USER_ID}, CURRENT_DATE - 4, 350, 'gym'),
    (${USER_ID}, CURRENT_DATE - 3, 100, NULL),
    (${USER_ID}, CURRENT_DATE - 2, 100, NULL),
    (${USER_ID}, CURRENT_DATE - 1, 50, NULL),
    (${USER_ID}, CURRENT_DATE, 50, NULL)
  `;

  await sql`
    INSERT INTO demo_state (user_id, location, travel_minutes)
    VALUES (${USER_ID}, 'home', 55)
    ON CONFLICT (user_id) DO UPDATE
    SET location = 'home', travel_minutes = 55, updated_at = now()
  `;

  const cal = await sql`SELECT COALESCE(SUM(active_calories),0)::int AS total FROM fitness_log WHERE user_id = ${USER_ID} AND date >= CURRENT_DATE - 6`;
  console.log("Seed complete.", {
    userId: USER_ID,
    weeklyCalories: cal[0]?.total,
    note: "Expected ~1100 active calories; last gym workout 4 days ago",
  });
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
