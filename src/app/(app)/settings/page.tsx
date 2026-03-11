import dynamic from "next/dynamic";
import { ContentSkeleton } from "@/components/layout";

const SettingsPage = dynamic(
  () => import("@/features/settings").then((m) => ({ default: m.SettingsPage })),
  { loading: () => <ContentSkeleton /> }
);

export default function Page() {
  return <SettingsPage />;
}
