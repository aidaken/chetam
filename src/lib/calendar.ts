/**
 * Calendar provider interface.
 * Seeded impl now; swap to Executor via CALENDAR_PROVIDER=executor later.
 */

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
};

export interface CalendarProvider {
  getCalendar(range?: string): Promise<{
    mode: "seeded" | "live";
    events: CalendarEvent[];
    range: string;
  }>;
  createEvent(input: {
    title: string;
    start: string;
    end: string;
    location?: string;
  }): Promise<{ mode: "seeded" | "live"; event: CalendarEvent }>;
}

const seededEvents: CalendarEvent[] = [
  {
    id: "cal-dropoff",
    title: "School drop-off",
    start: "today 08:15",
    end: "today 08:35",
    location: "Lincoln Elementary",
  },
  {
    id: "cal-open",
    title: "Free slot",
    start: "today 09:30",
    end: "today 10:30",
  },
  {
    id: "cal-alex",
    title: "Meet Alex",
    start: "today 16:00",
    end: "today 17:00",
    location: "Cafe on Market St",
    attendees: ["alex@example.com"],
  },
  {
    id: "cal-standup",
    title: "Team standup",
    start: "today 11:00",
    end: "today 11:20",
  },
];

/** In-memory events created during this process (demo). */
const created: CalendarEvent[] = [];

class SeededCalendarProvider implements CalendarProvider {
  async getCalendar(range = "today") {
    const events = [...seededEvents, ...created];
    return {
      mode: "seeded" as const,
      range,
      events,
    };
  }

  async createEvent(input: {
    title: string;
    start: string;
    end: string;
    location?: string;
  }) {
    const event: CalendarEvent = {
      id: `seed-${Date.now()}`,
      ...input,
    };
    created.push(event);
    return { mode: "seeded" as const, event };
  }
}

class ExecutorCalendarProvider implements CalendarProvider {
  // TODO(verify): Executor Google Calendar tool paths — not built yet
  async getCalendar(range = "today") {
    throw new Error(
      "CALENDAR_PROVIDER=executor is not implemented yet; use seeded",
    );
  }
  async createEvent() {
    throw new Error(
      "CALENDAR_PROVIDER=executor is not implemented yet; use seeded",
    );
  }
}

export function getCalendarProvider(): CalendarProvider {
  if (process.env.CALENDAR_PROVIDER === "executor") {
    return new ExecutorCalendarProvider();
  }
  return new SeededCalendarProvider();
}

export async function getCalendar(range = "today") {
  return getCalendarProvider().getCalendar(range);
}

export async function createCalendarEvent(input: {
  title: string;
  start: string;
  end: string;
  location?: string;
}) {
  return getCalendarProvider().createEvent(input);
}
