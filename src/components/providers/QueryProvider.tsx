'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds - balanced between performance and freshness
            gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache
            refetchOnWindowFocus: true, // Refetch when window regains focus to ensure fresh data
            refetchOnReconnect: true, // Refetch when reconnecting to network
            refetchOnMount: true, // Always refetch on component mount if data is stale
            retry: 1, // Only retry once on failure
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
