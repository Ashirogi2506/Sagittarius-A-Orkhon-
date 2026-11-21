import type { Announcement } from "../types";
import { DEMO_ANNOUNCEMENTS, VERIFIED_NOTES } from "../data/announcements";

/**
 * Source adapters: one per organisation feed. A real adapter is only marked `live: true`
 * when it reads from an official API, RSS feed, an authorised data feed, or permitted
 * retrieval. Until then each adapter returns demo or manually checked data and says so.
 */
export type SourceKind = "official-api" | "rss" | "authorized-feed" | "admin" | "permitted-retrieval" | "demo";

export interface SourceAdapter {
  id: string;
  name: string;
  kind: SourceKind;
  live: boolean;
  homepage: string;
  fetch(): Promise<Announcement[]>;
}

export interface SourceStatus {
  id: string; name: string; kind: SourceKind; live: boolean; homepage: string;
  lastUpdated: string; count: number; error?: string;
}

/** Erdenet Us demo adapter. Replace `fetch` with the official feed once access is granted. */
export const erdenetUsDemoAdapter: SourceAdapter = {
  id: "erdenet-us",
  name: "Эрдэнэт Ус (жишээ холболт)",
  kind: "demo",
  live: false,
  homepage: "https://erdenetus.mn/",
  async fetch() {
    return DEMO_ANNOUNCEMENTS.filter((a) => a.category === "water");
  },
};

/** Other organisations, demo until connected. */
export const otherDemoAdapter: SourceAdapter = {
  id: "orkhon-demo",
  name: "Бусад байгууллага (жишээ)",
  kind: "demo",
  live: false,
  homepage: "https://www.erdenet.mn/",
  async fetch() {
    return DEMO_ANNOUNCEMENTS.filter((a) => a.category !== "water");
  },
};

/** Administrator-entered notes: what the team checked by hand on official channels. */
export const adminNotesAdapter: SourceAdapter = {
  id: "admin-notes",
  name: "Гараар шалгасан тэмдэглэл (Sagittarius баг)",
  kind: "admin",
  live: false,
  homepage: "https://erdenetus.mn/service/live",
  async fetch() {
    return VERIFIED_NOTES;
  },
};

export const ADAPTERS: SourceAdapter[] = [adminNotesAdapter, erdenetUsDemoAdapter, otherDemoAdapter];

export async function collectAnnouncements(): Promise<{ items: Announcement[]; sources: SourceStatus[] }> {
  const items: Announcement[] = [];
  const sources: SourceStatus[] = [];
  for (const a of ADAPTERS) {
    const status: SourceStatus = { id: a.id, name: a.name, kind: a.kind, live: a.live, homepage: a.homepage, lastUpdated: new Date().toISOString(), count: 0 };
    try {
      const got = await a.fetch();
      items.push(...got);
      status.count = got.length;
      const newest = got.map((g) => g.checkedAt).sort().pop();
      if (newest) status.lastUpdated = newest;
    } catch (e) {
      status.error = e instanceof Error ? e.message : "Алдаа";
    }
    sources.push(status);
  }
  items.sort((x, y) => (y.publishedAt > x.publishedAt ? 1 : y.publishedAt < x.publishedAt ? -1 : 0));
  return { items, sources };
}
