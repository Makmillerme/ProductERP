import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/layout";

const DataModelPage = dynamic(
  () =>
    import("@/features/management/components/data-model-page").then((m) => ({
      default: m.DataModelPage,
    })),
  { loading: () => <ContentSkeleton /> },
);

export default function Page() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <DataModelPage />
    </Suspense>
  );
}
