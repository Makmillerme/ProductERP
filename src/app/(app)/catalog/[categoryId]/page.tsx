import dynamic from "next/dynamic";
import { ContentSkeleton } from "@/components/layout";

const VehiclesPage = dynamic(
  () => import("@/features/vehicles").then((m) => ({ default: m.VehiclesPage })),
  { loading: () => <ContentSkeleton /> }
);

type PageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function CatalogCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  return <VehiclesPage categoryId={categoryId} />;
}
