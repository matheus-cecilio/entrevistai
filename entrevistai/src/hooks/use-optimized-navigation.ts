"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

export function useOptimizedNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigateTo = useCallback((path: string) => {
    startTransition(() => {
      router.push(path);
    });
  }, [router]);

  const preloadRoute = useCallback((path: string) => {
    router.prefetch(path);
  }, [router]);

  return {
    navigateTo,
    preloadRoute,
    isPending
  };
}
