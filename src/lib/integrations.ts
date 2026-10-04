/**
 * Thin facade — prefer importing from calendar/drive/email/exa modules.
 * Travel time stays here (demo toggle / optional Routes API).
 */

export { getCalendar, createCalendarEvent } from "@/lib/calendar";
export { findDriveFile } from "@/lib/drive";
export { sendEmail } from "@/lib/email";
export { searchDadGifts as webSearchGifts } from "@/lib/exa";

export async function getTravelTime(
  origin: string,
  destination: string,
  fallbackMinutes: number,
): Promise<{ mode: "live" | "simulated"; minutes: number; origin: string; destination: string }> {
  if (process.env.GOOGLE_ROUTES_API_KEY) {
    try {
      const res = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GOOGLE_ROUTES_API_KEY,
            "X-Goog-FieldMask": "routes.duration",
          },
          body: JSON.stringify({
            origin: { address: origin },
            destination: { address: destination },
            travelMode: "DRIVE",
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const seconds = Number(
          String(data.routes?.[0]?.duration ?? "0s").replace("s", ""),
        );
        if (seconds > 0) {
          return {
            mode: "live",
            minutes: Math.ceil(seconds / 60),
            origin,
            destination,
          };
        }
      } else {
        console.error("[routes] non-OK", {
          status: res.status,
          body: await res.text(),
        });
      }
    } catch (error) {
      console.warn("[routes] failed, using travel toggle", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    mode: "simulated",
    minutes: fallbackMinutes,
    origin,
    destination,
  };
}
