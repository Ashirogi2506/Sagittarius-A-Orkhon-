import { ERDENET } from "../data/places";
import { weatherLabel, type Weather } from "../civic";

// Erdenet weather from Open-Meteo (free, no API key, model forecast — not an official
// NAMEM bulletin). Cached on the server for 15 minutes so every visitor shares one upstream call.
const CACHE_MS = 15 * 60_000;
const URL_ = `https://api.open-meteo.com/v1/forecast?latitude=${ERDENET[0]}&longitude=${ERDENET[1]}`
  + "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day"
  + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum"
  + "&timezone=Asia%2FUlaanbaatar&forecast_days=3&wind_speed_unit=ms";

const g = globalThis as unknown as { __soWeather?: { at: number; w: Weather } };

export async function getWeather(): Promise<Weather> {
  const now = Date.now();
  if (g.__soWeather && now - g.__soWeather.at < CACHE_MS) return g.__soWeather.w;
  try {
    const r = await fetch(URL_, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const c = d.current;
    const w: Weather = {
      ok: true,
      fetchedAt: new Date().toISOString(),
      now: { temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), wind: Math.round(c.wind_speed_10m), code: c.weather_code, isDay: c.is_day === 1 },
      days: (d.daily.time as string[]).map((date, i) => ({
        date, min: Math.round(d.daily.temperature_2m_min[i]), max: Math.round(d.daily.temperature_2m_max[i]),
        code: d.daily.weather_code[i], precip: Math.round((d.daily.precipitation_sum[i] ?? 0) * 10) / 10,
      })),
    };
    g.__soWeather = { at: now, w };
    return w;
  } catch {
    // Keep showing the last good reading for up to 3 hours rather than nothing.
    if (g.__soWeather && now - g.__soWeather.at < 3 * 3600_000) return g.__soWeather.w;
    return { ok: false, fetchedAt: new Date().toISOString() };
  }
}

export function weatherContext(w: Weather): string {
  if (!w.ok || !w.now) return "ЦАГ АГААР: одоогоор мэдээлэл татаж чадсангүй.";
  const n = w.now;
  const days = (w.days ?? []).map((d) => `${d.date}: ${d.min}…${d.max}°C, ${weatherLabel(d.code).text.toLowerCase()}${d.precip ? `, тунадас ${d.precip} мм` : ""}`).join("; ");
  return `ЦАГ АГААР (Эрдэнэт, Open-Meteo загварын урьдчилсан мэдээ, албан ёсны УЦУОШГ-ын мэдээ биш): одоо ${n.temp}°C, мэдрэгдэх ${n.feels}°C, салхи ${n.wind} м/с, ${weatherLabel(n.code, n.isDay).text.toLowerCase()}. Ойрын өдрүүд: ${days}.`;
}
