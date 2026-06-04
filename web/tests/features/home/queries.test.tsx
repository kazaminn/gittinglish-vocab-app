import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHomeProblemsQuery } from '../../../src/features/home/queries';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useHomeProblemsQuery', () => {
  it('loads the bundled problems for the requested dataset and mode', async () => {
    const { result } = renderHook(
      () =>
        useHomeProblemsQuery({
          datasetId: 'gitverbs85',
          drillMode: 'word_to_meaning',
        }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length ?? 0).toBeGreaterThan(0);
  });
});
