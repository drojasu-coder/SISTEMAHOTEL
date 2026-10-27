import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from '@/app/router/AppRouter';
import { AuthProvider } from '@/features/auth/AuthContext';
import { LocaleProvider } from '@/i18n/LocaleContext';

export const AppProviders: React.FC = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutos
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider><AuthProvider>
        <AppRouter />
      </AuthProvider></LocaleProvider>
    </QueryClientProvider>
  );
};
