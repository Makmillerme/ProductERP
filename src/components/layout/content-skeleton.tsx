import { Skeleton } from "@/components/ui/skeleton";

/**
 * Скелетон контенту сторінки для loading.tsx та dynamic() fallback.
 * Імітує заголовок та блок тексту для плавного переходу.
 */
export function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-3/4 max-w-lg" />
      </div>
    </div>
  );
}
