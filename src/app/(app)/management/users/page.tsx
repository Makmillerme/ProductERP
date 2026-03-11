import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/layout";

const UsersPage = dynamic(
  () =>
    import("@/features/management/components/users-page").then((m) => ({
      default: m.UsersPage,
    })),
  { loading: () => <ContentSkeleton /> },
);

export default function Page() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <UsersPage />
    </Suspense>
  );
}
