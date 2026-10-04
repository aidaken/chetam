import Exa from "exa-js";
import { getMemories } from "@/lib/data";

export type GiftResult = {
  title: string;
  url: string;
};

function isGiftGuideListicle(title: string, url: string) {
  const hay = `${title} ${url}`.toLowerCase();
  return (
    /gift[- ]?guide|best gifts|gifts for dad|amazon\.com\/s\?|gift.?ideas.?for/i.test(
      hay,
    ) || /\/gift-guide|\/best-gifts|\/gifts-for-/i.test(url)
  );
}

/**
 * Niche gift search via official exa-js SDK.
 * @see https://exa.ai/docs/sdks/javascript-sdk
 */
export async function searchDadGifts(options?: {
  queryOverride?: string;
}): Promise<{
  mode: "live";
  query: string;
  results: GiftResult[];
}> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set");
  }

  const memories = await getMemories();
  const facts = memories.map((m) => m.fact);
  const interestBits = facts.filter((f) =>
    /radio|chili|pepper|coffee|pour-over|budget|birthday|restore/i.test(f),
  );
  const query =
    options?.queryOverride?.trim() ||
    [
      "buy vintage radio restoration tool or vacuum tube tester under $60",
      "OR rare chili pepper seed starter kit under $60",
      "product page specialty shop",
      "NOT gift guide listicle",
      interestBits.length ? `Context: ${interestBits.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

  const exa = new Exa(apiKey);
  let raw: Awaited<ReturnType<Exa["search"]>>;
  try {
    raw = await exa.search(query, {
      type: "auto",
      numResults: 8,
      // Prefer product / specialty pages over generic roundups
      excludeDomains: ["reddit.com", "quora.com", "pinterest.com"],
      contents: { highlights: true },
      // TODO(verify): `objective` supported in exa-js — confirmed in Exa JS docs
      objective:
        "Find specific buyable gifts under $60 for someone who restores vintage radios and grows chili peppers. Prefer niche sellers and product pages; avoid generic gift-guide listicles.",
    });
  } catch (error) {
    console.error("[exa] search failed", {
      message: error instanceof Error ? error.message : String(error),
      // TODO(verify): log raw SDK error fields without secrets
      raw: error,
    });
    throw error;
  }

  const ranked = (raw.results ?? [])
    .map((r) => ({
      title: r.title?.trim() || r.url,
      url: r.url,
    }))
    .filter((r) => Boolean(r.url))
    .sort((a, b) => {
      const aBad = isGiftGuideListicle(a.title, a.url) ? 1 : 0;
      const bBad = isGiftGuideListicle(b.title, b.url) ? 1 : 0;
      return aBad - bBad;
    })
    .filter((r) => !isGiftGuideListicle(r.title, r.url))
    .slice(0, 5);

  if (ranked.length === 0) {
    // Fall back to unfiltered titles if everything looked like a listicle
    const fallback = (raw.results ?? [])
      .map((r) => ({ title: r.title?.trim() || r.url, url: r.url }))
      .filter((r) => Boolean(r.url))
      .slice(0, 5);
    console.warn("[exa] all results looked like listicles; returning raw top", {
      count: fallback.length,
    });
    return { mode: "live", query, results: fallback };
  }

  return { mode: "live", query, results: ranked };
}

export async function pingExa(): Promise<{ ok: boolean; error?: string }> {
  try {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) return { ok: false, error: "EXA_API_KEY missing" };
    const exa = new Exa(apiKey);
    const res = await exa.search("vintage radio tube tester", {
      type: "auto",
      numResults: 1,
      contents: { highlights: true },
    });
    if (!res.results?.length) {
      return { ok: false, error: "Exa returned zero results" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[exa] ping failed", {
      message: error instanceof Error ? error.message : String(error),
      raw: error,
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Exa ping failed",
    };
  }
}
