import { describe, it, expect, vi } from 'vitest';
import { createAuth } from '../../src/auth';
import { normalizeApiOptions } from '../../src/config';
import { VizApiAuthError } from '../../src/errors';

function res(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('authedFetch', () => {
  it('fetches a nonce, signs it, and attaches auth headers', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/auth/nonce')) return res({ nonce: 'NONCE123' });
      return res({ ok: true });
    });
    const sign = vi.fn((bytes: Uint8Array) => {
      // assert the signer receives the utf-8 nonce bytes
      expect(new TextDecoder().decode(bytes)).toBe('NONCE123');
      return 'deadbeef';
    });
    const auth = createAuth(normalizeApiOptions({
      baseUrl: 'https://api.test', fetch: fetchMock as unknown as typeof fetch,
      auth: { account: 'alice', sign },
    }));

    await auth.authedFetch('/webhooks', { method: 'GET' });

    const signed = calls[1]!;
    const headers = new Headers(signed.init.headers);
    expect(headers.get('X-Auth-Account')).toBe('alice');
    expect(headers.get('X-Auth-Nonce')).toBe('NONCE123');
    expect(headers.get('X-Auth-Signature')).toBe('deadbeef');
    expect(sign).toHaveBeenCalledOnce();
  });

  it('throws VizApiAuthError on 401', async () => {
    const fetchMock = async (url: string) =>
      url.endsWith('/auth/nonce') ? res({ nonce: 'N' }) : res({ detail: 'bad sig' }, 401);
    const auth = createAuth(normalizeApiOptions({
      baseUrl: 'https://api.test', fetch: fetchMock as unknown as typeof fetch,
      auth: { account: 'alice', sign: () => 'sig' },
    }));
    await expect(auth.authedFetch('/webhooks', { method: 'GET' })).rejects.toBeInstanceOf(VizApiAuthError);
  });

  it('throws VizApiAuthError when no signer is configured', async () => {
    const auth = createAuth(normalizeApiOptions({
      baseUrl: 'https://api.test', fetch: (async () => res({ nonce: 'N' })) as unknown as typeof fetch,
    }));
    await expect(auth.authedFetch('/webhooks', { method: 'GET' })).rejects.toBeInstanceOf(VizApiAuthError);
  });

  it('a per-call signer overrides the client default', async () => {
    const fetchMock = async (url: string) => url.endsWith('/auth/nonce') ? res({ nonce: 'N' }) : res({ ok: true });
    const auth = createAuth(normalizeApiOptions({
      baseUrl: 'https://api.test', fetch: fetchMock as unknown as typeof fetch,
      auth: { account: 'default', sign: () => 'x' },
    }));
    let seen = '';
    await auth.authedFetch('/webhooks', { method: 'GET' }, {
      account: 'override', sign: () => { seen = 'override-signed'; return 'y'; },
    });
    expect(seen).toBe('override-signed');
  });
});
