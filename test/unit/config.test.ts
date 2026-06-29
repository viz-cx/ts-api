import { describe, it, expect } from 'vitest';
import { DEFAULT_API_BASE, DEFAULT_WS_URL, normalizeApiOptions } from '../../src/config';

describe('normalizeApiOptions', () => {
  it('applies defaults when nothing is passed', () => {
    const n = normalizeApiOptions({});
    expect(n.baseUrl).toBe(DEFAULT_API_BASE);
    expect(n.wsUrl).toBe(DEFAULT_WS_URL);
    expect(typeof n.fetch).toBe('function');
    expect(n.auth).toBeUndefined();
  });

  it('strips a trailing slash from baseUrl', () => {
    const n = normalizeApiOptions({ baseUrl: 'https://x.test/' });
    expect(n.baseUrl).toBe('https://x.test');
  });

  it('passes through an injected fetch, WebSocket, and auth', () => {
    const fakeFetch = (() => {}) as unknown as typeof fetch;
    const signer = { account: 'alice', sign: () => 'deadbeef' };
    const n = normalizeApiOptions({ fetch: fakeFetch, auth: signer });
    expect(n.fetch).toBe(fakeFetch);
    expect(n.auth).toBe(signer);
  });
});
