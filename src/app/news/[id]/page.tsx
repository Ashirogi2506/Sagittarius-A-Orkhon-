import { NewsArticle } from "@/components/NewsArticle";
import { StoreProvider } from "@/lib/store";

export default async function NewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoreProvider><NewsArticle id={id} /></StoreProvider>;
}
