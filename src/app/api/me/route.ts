import { currentUser } from "@/lib/server/auth";
import { all } from "@/lib/server/db";

// The signed-in user plus their own reports.
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null });
  const reports = await all("SELECT tracking, title, category, status, created_at AS at FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 30", user.id);
  return Response.json({ user, reports });
}
