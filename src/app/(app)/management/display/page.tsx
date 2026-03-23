import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/layout";

const DisplayPage = dynamic(
  () =>
    import("@/features/management/components/display-page").then((m) => ({
      default: m.DisplayPage,
    })),
  { loading: () => <ContentSkeleton /> },
);

export default function Page() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <DisplayPage />
    </Suspense>
  );
}
