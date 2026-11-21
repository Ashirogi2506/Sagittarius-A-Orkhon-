# SMART ORKHON — Ухаалаг Орхон

Орхон аймаг, Эрдэнэт хотын иргэдэд зориулсан мэдээллийн сайт (Sagittarius багийн хакатоны төсөл, MVP).
Сайт: https://smart-orkhon.vercel.app · Android апп (TWA) мөн энэ сайтыг нээдэг.

**Үндсэн хэсгүүд:** яаралтай мэдээ, мэдээний сайт хэлбэрийн мэдэгдэл, асуудал мэдээлэх (хяналтын дугаартай),
газрын зураг (асуудал, замын түгжрэл, тасралт), төрийн үйлчилгээ, Эрдэнэттэй танилцах, үр дүн ба иргэдийн санаа,
апп суулгах, «Орхон AI туслах» чатбот.

## Ажиллуулах

1. Node.js 20+ суулгана.
2. `npm install`
3. `.env.example`-г `.env.local` нэрээр хуулж бөглөнө. Gemini түлхүүргүй бол чатбот бэлдсэн хариултаар ажиллана.
4. `npm run dev` → http://localhost:3000

Шалгах:

```bash
node node_modules/typescript/bin/tsc --noEmit -p .
node node_modules/eslint/bin/eslint.js src
npm run build
```

## Технологи

Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind CSS v4, framer-motion, lucide-react,
react-leaflet (OpenStreetMap), `@libsql/client` (локалд SQLite файл, production-д Turso), Gemini (`@google/genai`).

> Энэ Next.js-ийн хувилбар шинэ, өмнөхөөс өөр. Код бичихээсээ өмнө [AGENTS.md](AGENTS.md) болон
> `node_modules/next/dist/docs/`-ийг унш.

## Бүтэц

| Хавтас | Юу байна |
|---|---|
| `src/app/page.tsx` | Нүүр хуудасны хэсгүүдийн дараалал |
| `src/app/api/*` | alerts, announcements, auth, chat, me, reports, traffic, weather, assetlinks |
| `src/components/*` | Хуудасны хэсэг бүр нэг файл (`Announcements.tsx`, `ReportSection.tsx`, `MapSection.tsx` …), `ui.tsx` нь нийтлэг элемент |
| `src/lib/store.tsx` | Клиентийн төлөв (`useStore`) |
| `src/lib/labels.ts` | Ангиллын нэр, өнгө, огноо/хугацааны туслах функц |
| `src/lib/data/*` | Гараар бэлдсэн өгөгдөл (мэдэгдэл, үйлчилгээ, үзэх газар, камер …) |
| `src/lib/integrations/*` | Гадны эх сурвалж (замын камер, цаг агаар) |
| `src/lib/server/*` | DB, нэвтрэлт, хамгаалалт, чатботын мэдлэг ба prompt |
| `android/` | Google Play-д гаргах заавар, зураг |

## Аюулгүй байдал ба өгөгдөл

- Түлхүүрүүд зөвхөн серверт. `.env*`, `data/`, `*.keystore` git-д орохгүй.
- Чатботын асуулт хадгалагдахгүй. Утас, регистр AI руу илгээхээс өмнө нуугдана.
- «Жишээ» шошготой мэдээлэл бодит биш. Иргэний мэдээлэл байгууллага руу автоматаар очихгүй.

Байршуулах заавар: [DEPLOY.md](DEPLOY.md). Үргэлжлүүлэн хөгжүүлэх тэмдэглэл: [HANDOFF.md](HANDOFF.md).

Газрын зураг © OpenStreetMap contributors.
