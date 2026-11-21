import { CAMERAS } from "@/lib/data/cameras";
import { getTraffic, levelLabel, levelRank } from "@/lib/integrations/traffic";
import { clientKey, rateLimit } from "@/lib/server/guard";

// Current road load for the browser: every public camera, with a vehicle count where the
// camera centre reports one. The upstream call is cached for 60 s on the server, so many
// open pages polling every 5 minutes still hit dedtuv.erdenet.mn at most once a minute.
export async function GET(req: Request) {
  const rl = rateLimit("traffic:" + clientKey(req), 20, 60_000);
  if (!rl.ok) return Response.json({ error: "Хэт олон хүсэлт." }, { status: 429 });
  const s = await getTraffic();
  const byId = new Map(s.spots.map((x) => [x.id, x]));
  const known = new Set(CAMERAS.map((c) => c.id));
  const all = [
    ...CAMERAS.map((c) => ({ ...c, live: byId.get(c.id) })),
    ...s.spots.filter((x) => !known.has(x.id)).map((x) => ({ id: x.id, name: x.name, lat: x.lat, lng: x.lng, live: x })),
  ];
  const spots = all
    .map(({ id, name, lat, lng, live }) => live && !live.stale
      ? { id, name, lat, lng, level: live.level, levelLabel: levelLabel(live.level), rank: levelRank(live.level), vehicles: live.vehicles, detectedAt: live.detectedAt }
      : { id, name, lat, lng, level: "NODATA", levelLabel: live ? "Мэдээлэл хуучирсан" : "Тооллогогүй камер", rank: -1, vehicles: null, detectedAt: live?.detectedAt ?? null })
    .sort((a, b) => b.rank - a.rank || (b.vehicles ?? 0) - (a.vehicles ?? 0));
  const counted = spots.filter((x) => x.rank >= 0);
  const busy = spots.filter((x) => x.rank >= 1);
  return Response.json({ ok: s.ok, fetchedAt: s.fetchedAt, source: s.source, cameras: counted.length, total: spots.length, spots, busy });
}
