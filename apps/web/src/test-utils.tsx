import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export function renderWithQueryClient(element: ReactElement): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
}

export function stubFetch(respond: (url: string, init?: RequestInit) => Response) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async (url, init) => respond(url, init),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
