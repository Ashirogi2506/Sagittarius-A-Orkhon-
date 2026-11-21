import type { Metadata } from "next";
import Link from "next/link";

// Privacy policy. Google Play needs a public URL for it, plus one that explains account deletion (#delete).
// Keep it in step with what the code actually stores: src/lib/server/db.ts (tables) and the API routes.
export const metadata: Metadata = {
  title: "Нууцлалын бодлого — SMART ORKHON",
  description: "«Ухаалаг Орхон» сайт, апп ямар мэдээлэл хадгалдаг, хэнтэй хуваалцдаг, бүртгэлээ хэрхэн устгах вэ.",
};

const UPDATED = "2026-11-21";
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

function H({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="mt-10 scroll-mt-6 font-display text-xl font-bold text-snow">{children}</h2>;
}

export default function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[15px] leading-relaxed text-snow/90 md:py-16">
      <Link href="/" className="text-sm text-cyan underline">← Нүүр хуудас руу буцах</Link>
      <h1 className="mt-6 font-display text-3xl font-bold text-snow">Нууцлалын бодлого</h1>
      <p className="mt-2 text-sm text-muted">«SMART ORKHON — Ухаалаг Орхон» вэб сайт болон гар утасны апп · Шинэчилсэн: {UPDATED}</p>
      <p className="mt-6">SMART ORKHON бол Орхон аймгийн иргэдэд мэдэгдэл, шуурхай мэдээ, нийтийн тээвэр, төрийн үйлчилгээний мэдээллийг нэг дор хүргэх, асуудал мэдээлэх боломж олгох иргэний технологийн платформ (Sagittarius баг, хакатоны MVP). Сайт болон апп ижил агуулгатай: апп нь энэ сайтыг бүтэн дэлгэцээр нээдэг.</p>

      <H>1. Бид ямар мэдээлэл хадгалдаг вэ</H>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li><b>Бүртгэл</b> (бүртгүүлсэн бол): нэр, имэйл, нууц үг (зөвхөн давтагдашгүй нууцалсан хэлбэрээр, scrypt), сонгосон байршил, бүртгүүлсэн огноо.</li>
        <li><b>Мэдээлсэн асуудал:</b> гарчиг, ангилал, байршил, тайлбар, хавсаргасан зураг (заавал биш), төлөв, хяналтын дугаар. Утас, регистр, имэйл бичсэн бол илгээхээс өмнө автоматаар нуугдана.</li>
        <li><b>AI туслахад тавьсан асуулт:</b> хадгалагдахгүй. Хариулт үүсгэхэд л ашиглагдана (утас, регистр автоматаар нуугдана).</li>
        <li><b>Нэвтрэх сешн:</b> таныг нэвтэрсэн байлгах санамсаргүй тэмдэгт (cookie), 30 хоног хүчинтэй. Серверт зөвхөн түүний хэш хадгалагдана.</li>
        <li><b>Таны төхөөрөмж дээр</b> (серверт илгээгдэхгүй): тохиргоо, уншсан мэдэгдэл, илгээсэн асуудлын хуулбар, санал өгсөн санаа.</li>
      </ul>
      <p className="mt-3">Бид таны байршлыг (GPS) автоматаар авдаггүй, зар сурталчилгаа харуулдаггүй, мэдээллийг худалдахгүй.</p>

      <H>2. Юунд ашигладаг вэ</H>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Асуудлыг бүртгэж, хяналтын дугаараар явцыг харуулах, админ төлөвийг шинэчлэх.</li>
        <li>AI туслахаар асуултад хариулах.</li>
      </ul>
      <p className="mt-3">Иргэдийн мэдээлсэн асуудал албан байгууллагад автоматаар илгээгддэггүй.</p>

      <H>3. Гуравдагч талын үйлчилгээ</H>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li><b>Google Gemini API:</b> AI туслахад тавьсан асуулт хариулт үүсгэхийн тулд Google руу илгээгдэнэ.</li>
        <li><b>Vercel:</b> сайтыг байршуулдаг сервер.</li>
        <li><b>Turso:</b> дээрх мэдээллийг хадгалдаг өгөгдлийн сан.</li>
        <li><b>OpenStreetMap:</b> газрын зургийн зургууд таны төхөөрөмжөөс шууд ачаалагдана.</li>
        <li><b>Open-Meteo:</b> цаг агаарын мэдээг сервер авдаг (таны мэдээлэл илгээгдэхгүй).</li>
      </ul>

      <H>4. Хадгалах хугацаа</H>
      <p className="mt-3">Бүртгэл таныг устгах хүртэл хадгалагдана. Мэдээлсэн асуудал хяналтын дугаарт хэрэгтэй тул нэргүй хэлбэрээр хадгалагдана.</p>

      <H id="delete">5. Бүртгэл, мэдээллээ устгах</H>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>Сайт эсвэл аппад нэвтэрнэ.</li>
        <li>Дээд буланд байгаа өөрийн нэрийн үсэг бүхий товчийг дарна.</li>
        <li>Доод хэсгийн <b>«Бүртгэлээ устгах»</b>-ыг дарж, нууц үгээ оруулаад <b>«Устгах»</b> дарна.</li>
      </ol>
      <p className="mt-3">Устгахад нэр, имэйл, нууц үг, нэвтрэх сешн тань шууд, бүрмөсөн устгагдана. Мэдээлсэн асуудлууд тантай холбоогүй, нэргүй хэлбэрээр үлдэнэ.</p>
      {CONTACT && <p className="mt-3">Нэвтэрч чадахгүй байгаа бол <a href={`mailto:${CONTACT}`} className="text-cyan underline">{CONTACT}</a> хаягаар бүртгэлтэй имэйлээсээ хүсэлт илгээнэ үү.</p>}

      <H>6. Хүүхэд</H>
      <p className="mt-3">Үйлчилгээ нь бүх насныханд нээлттэй боловч 13-аас доош насны хүүхэд бүртгэл үүсгэхдээ эцэг эхийн зөвшөөрөлтэй байх ёстой.</p>

      <H>7. Өөрчлөлт</H>
      <p className="mt-3">Энэ бодлого өөрчлөгдвөл энэ хуудсанд шинэчилсэн огноотой нийтэлнэ.</p>
      {CONTACT && <p className="mt-6 text-sm text-muted">Холбоо барих: <a href={`mailto:${CONTACT}`} className="text-cyan underline">{CONTACT}</a></p>}
    </main>
  );
}
