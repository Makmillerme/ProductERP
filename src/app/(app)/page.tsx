import dynamic from "next/dynamic";
import { ContentSkeleton } from "@/components/layout";

const HomePage = dynamic(
  () => import("@/features/home").then((m) => ({ default: m.HomePage })),
  { loading: () => <ContentSkeleton /> }
);

export default function Page() {
  return <HomePage />;
}
