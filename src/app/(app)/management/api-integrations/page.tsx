import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/layout";

const ApiIntegrationsPage = dynamic(
  () =>
    import("@/features/management/components/api-integrations-page").then((m) => ({
      default: m.ApiIntegrationsPage,
    })),
  { loading: () => <ContentSkeleton /> },
);

export default function Page() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ApiIntegrationsPage />
    </Suspense>
  );
}
