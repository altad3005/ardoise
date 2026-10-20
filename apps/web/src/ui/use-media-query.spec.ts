import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './use-media-query.ts';

function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<() => void>();
  const mediaQueryList = {
    matches: initialMatches,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => mediaQueryList);
  return (matches: boolean) => {
    mediaQueryList.matches = matches;
    listeners.forEach((listener) => listener());
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  it('follows the media query', () => {
    const changeMatches = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'));
    expect(result.current).toBe(false);

    act(() => changeMatches(true));

    expect(result.current).toBe(true);
  });

  it('does not match where media queries are unsupported', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'));
    expect(result.current).toBe(false);
  });
});
