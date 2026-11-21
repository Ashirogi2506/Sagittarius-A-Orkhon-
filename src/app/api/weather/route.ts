import { getWeather } from "@/lib/integrations/weather";

export async function GET() {
  const w = await getWeather();
  return Response.json(w, { headers: { "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=300" } });
}
