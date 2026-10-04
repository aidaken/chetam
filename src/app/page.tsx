"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Pending = {
  id: string | null;
  summary: string | null;
  count: number;
};

const QUICK = [
  { label: "Morning briefing", scene: "morning" },
  { label: "Block app time", scene: "goalblock" },
  { label: "Dad's birthday", scene: "birthday" },
  { label: "Leave now", scene: "leavenow" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [travel, setTravel] = useState(55);
  const [pending, setPending] = useState<Pending>({
    id: null,
    summary: null,
    count: 0,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshPending = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/pending");
      const data = await res.json();
      setPending({
        id: data.id ?? null,
        summary: data.summary ?? null,
        count: Number(data.count ?? 0),
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    fetch("/api/demo/location")
      .then((r) => r.json())
      .then((d) => setTravel(Number(d.travel_minutes ?? 55)))
      .catch(() => undefined);
    void refreshPending();
  }, [refreshPending]);

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.text || "Something went quiet on my end.",
        },
      ]);
      await refreshPending();
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "I hit a snag. Try again in a second.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function fireScene(scene: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/demo/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.text || "Trigger returned empty.",
        },
      ]);
      if (data.pending) {
        setPending({
          id: data.pending.id ?? null,
          summary: data.pending.summary ?? null,
          count: Number(data.pending.count ?? 0),
        });
      } else {
        await refreshPending();
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Trigger failed.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
      setMessages([]);
      setTravel(55);
      setPending({ id: null, summary: null, count: 0 });
      setInput("");
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function updateTravel(minutes: number) {
    setTravel(minutes);
    await fetch("/api/demo/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: "home", travelMinutes: minutes }),
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendText(input);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 md:px-6">
      <header className="mb-4 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-sea uppercase">
            Personal assistant
          </p>
          <h1 className="font-display text-4xl leading-none text-ink md:text-5xl">
            Chetam
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink/70">
            Text him. He knows your goals, watches your day, and finishes the
            follow-through after you say yes.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void resetDemo()}
            className="rounded-full border border-ink/15 bg-foam px-4 py-2 text-sm font-medium text-ink transition hover:border-sea hover:text-sea-deep disabled:opacity-50"
          >
            Reset demo
          </button>
          <Link
            href="/notebook"
            className="rounded-full border border-ink/15 bg-foam px-4 py-2 text-sm font-medium text-ink transition hover:border-sea hover:text-sea-deep"
          >
            Notebook
          </Link>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.scene}
            type="button"
            disabled={busy}
            onClick={() => void fireScene(q.scene)}
            className="rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/80 backdrop-blur transition hover:border-sea/40 hover:text-sea-deep disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-xs text-ink/70">
          Travel
          <select
            value={travel}
            onChange={(e) => void updateTravel(Number(e.target.value))}
            className="bg-transparent font-medium text-ink outline-none"
          >
            <option value={55}>55 min</option>
            <option value={65}>65 min</option>
          </select>
        </label>
      </div>

      {pending.summary && (
        <p className="mb-3 text-xs text-ink/60">
          pending: {pending.summary}
        </p>
      )}

      <section className="relative flex min-h-[62vh] flex-1 flex-col overflow-hidden rounded-[28px] border border-ink/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,250,247,0.9))] shadow-[0_30px_80px_rgba(20,32,28,0.08)]">
        <div className="flex items-center gap-3 border-b border-ink/8 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sea text-sm font-semibold text-white">
            C
          </div>
          <div>
            <p className="text-sm font-semibold">Chetam</p>
            <p className="text-xs text-ink/55">iMessage-style demo thread</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-6">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 max-w-sm text-center">
              <p className="font-display text-2xl text-ink">Start the day</p>
              <p className="mt-2 text-sm text-ink/60">
                Hit Morning briefing, or text naturally. Approvals are one-word
                replies.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-md bg-sea text-white"
                    : "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-ink/5"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-2 text-sm text-ink/45 shadow-sm ring-1 ring-ink/5">
                Chetam is thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-ink/8 bg-white/50 p-3 backdrop-blur md:p-4"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Text Chetam…"
              disabled={busy}
              className="flex-1 rounded-full border border-ink/10 bg-foam px-4 py-3 text-sm outline-none ring-sea/30 placeholder:text-ink/35 focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-foam transition hover:bg-sea-deep disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
