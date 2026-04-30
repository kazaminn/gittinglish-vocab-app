import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { createDefaultServices, ServiceProvider } from './service';

export function Root() {
  const services = useMemo(() => createDefaultServices(), []);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceProvider value={services}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ServiceProvider>
    </QueryClientProvider>
  );
}
