import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/layout";

const AutomationsPage = dynamic(
  () =>
    import("@/features/management/components/automations-page").then((m) => ({
      default: m.AutomationsPage,
    })),
  { loading: () => <ContentSkeleton /> },
);

export default function Page() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <AutomationsPage />
    </Suspense>
  );
}
