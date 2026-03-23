import dynamic from "next/dynamic";
import { ContentSkeleton } from "@/components/layout";

const ProductsPage = dynamic(
  () => import("@/features/products").then((m) => ({ default: m.ProductsPage })),
  { loading: () => <ContentSkeleton /> }
);

type PageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function CatalogCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  return <ProductsPage categoryId={categoryId} />;
}
