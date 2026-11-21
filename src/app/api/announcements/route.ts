import { collectAnnouncements } from "@/lib/integrations";

export async function GET() {
  const { items, sources } = await collectAnnouncements();
  return Response.json({
    items,
    sources,
    live: sources.some((s) => s.live),
    note: "Албан ёсны байгууллагатай шууд холболт одоогоор байхгүй. Жишээ мэдээлэл болон гараар шалгасан тэмдэглэл харуулж байна.",
    generatedAt: new Date().toISOString(),
  });
}
