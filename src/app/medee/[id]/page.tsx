import { Suspense } from "react";
import { NewsArticle } from "@/components/Announcements";
import { ChatWidget } from "@/components/ChatWidget";
import { StoreProvider } from "@/lib/store";

async function Article({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <StoreProvider>
      <NewsArticle id={id} />
      <ChatWidget />
    </StoreProvider>
  );
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-4xl p-8" role="status">Мэдээг ачаалж байна…</p>}>
      <Article params={params} />
    </Suspense>
  );
}
