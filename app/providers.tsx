'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24 * 7, // 1주일
        staleTime: 1000 * 60 * 5, // 5분
        refetchOnWindowFocus: true,
      },
    },
  }));

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    // 브라우저 환경에서만 localStorage 접근 가능
    setPersister(createSyncStoragePersister({
      storage: window.localStorage,
    }));
  }, []);

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
