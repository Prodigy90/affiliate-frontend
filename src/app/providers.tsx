"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { Toaster } from "sonner";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data in memory for a while so we don't keep refetching
            // on every navigation.
            staleTime: 30_000,
            gcTime: 5 * 60 * 1000,
            // Failed API calls shouldn't keep retrying for a long time –
            // surface the error quickly.
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false
          }
        }
      })
  );

  // Note: Better Auth doesn't need a provider wrapper - it uses cookies directly
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
