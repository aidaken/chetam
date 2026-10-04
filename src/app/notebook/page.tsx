"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Goal = {
  id: string;
  title: string;
  metric: string | null;
  target: number | null;
  period: string | null;
};

type Memory = {
  id: string;
  fact: string;
  source: string;
  created_at: string;
};

type ActionRow = {
  id: string;
  type: string;
  summary: string;
  reason: string;
  approved: boolean;
  created_at: string;
};

type Nudge = {
  id: string;
  title: string;
  when: string;
  reason: string;
};

export default function NotebookPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notebook");
    const data = await res.json();
    setGoals(data.goals ?? []);
    setMemories(data.memories ?? []);
    setActions(data.actions ?? []);
    setNudges(data.nudges ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeMemory(id: string) {
    await fetch(`/api/notebook?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-sea uppercase">
            Visible memory
          </p>
          <h1 className="font-display text-5xl text-ink">Chetam&apos;s notebook</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/65">
            Everything he knows, every action he took, and why. Text stays the
            control surface — this page is for trust.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-ink/15 bg-foam px-4 py-2 text-sm font-medium transition hover:border-sea hover:text-sea-deep"
        >
          Back to chat
        </Link>
      </header>

      {loading ? (
        <p className="text-sm text-ink/50">Loading notebook…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <section>
            <h2 className="font-display text-2xl">Goals</h2>
            <ul className="mt-4 space-y-3">
              {goals.map((g) => (
                <li
                  key={g.id}
                  className="border-b border-ink/8 pb-3 text-sm leading-relaxed"
                >
                  <p className="font-semibold text-ink">{g.title}</p>
                  {(g.metric || g.target) && (
                    <p className="text-ink/55">
                      {g.metric}
                      {g.target != null ? ` · ${g.target}` : ""}
                      {g.period ? ` / ${g.period}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <h2 className="font-display mt-10 text-2xl">Upcoming nudges</h2>
            <ul className="mt-4 space-y-3">
              {nudges.length === 0 && (
                <li className="text-sm text-ink/45">No nudges right now.</li>
              )}
              {nudges.map((n) => (
                <li key={n.id} className="border-b border-ink/8 pb-3 text-sm">
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="text-ink/55">{n.when}</p>
                  <p className="text-xs text-ink/45">{n.reason}</p>
                </li>
              ))}
            </ul>

            <h2 className="font-display mt-10 text-2xl">Memory</h2>
            <ul className="mt-4 space-y-3">
              {memories.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-3 border-b border-ink/8 pb-3"
                >
                  <div>
                    <p className="text-sm text-ink">{m.fact}</p>
                    <p className="mt-1 text-xs text-ink/45">
                      {m.source} · {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeMemory(m.id)}
                    className="shrink-0 text-xs font-medium text-sea-deep underline-offset-2 hover:underline"
                  >
                    Forget
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl">Action log</h2>
            <p className="mt-1 text-sm text-ink/55">
              Writes that contact people or change the calendar only run after
              an explicit yes.
            </p>
            <ul className="mt-5 space-y-4">
              {actions.length === 0 && (
                <li className="text-sm text-ink/45">No actions yet.</li>
              )}
              {actions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-ink/8 bg-white/70 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold tracking-wide text-sea uppercase">
                      {a.type}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        a.approved
                          ? "bg-sea/10 text-sea-deep"
                          : "bg-ink/5 text-ink/50"
                      }`}
                    >
                      {a.approved ? "approved" : "proposed"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">{a.summary}</p>
                  <p className="mt-1 text-sm text-ink/55">{a.reason}</p>
                  <p className="mt-2 text-xs text-ink/40">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
