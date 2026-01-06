'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Determine staling time based on your needs. 
                // 1 minute is good for "fresh enough" data without constant refetching.
                staleTime: 60 * 1000,
                // Refetch on window focus ensures data is current when user returns
                refetchOnWindowFocus: true,
                // Auto-refresh every 15 minutes (in milliseconds)
                refetchInterval: 15 * 60 * 1000,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
