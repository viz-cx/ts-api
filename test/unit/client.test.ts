import { describe, it, expect, vi } from 'vitest';
import { createApiClient } from '../../src/client';

function res(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('createApiClient', () => {
  it('exposes rest, webhooks, and streamOps on one object', () => {
    const c = createApiClient({ baseUrl: 'https://api.test' });
    expect(typeof c.getProfile).toBe('function');
    expect(typeof c.getRichlist).toBe('function');
    expect(typeof c.webhooks.create).toBe('function');
    expect(typeof c.streamOps).toBe('function');
    expect(typeof c.authedFetch).toBe('function');
  });

  it('routes getProfile through the injected fetch', async () => {
    const fetchMock = vi.fn(async () => res({ name: 'alice' }));
    const c = createApiClient({ baseUrl: 'https://api.test', fetch: fetchMock as unknown as typeof fetch });
    const p = await c.getProfile('alice');
    expect(p?.name).toBe('alice');
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/profile/alice', expect.anything());
  });

  it('defaults baseUrl to api.viz.cx', async () => {
    const fetchMock = vi.fn(async () => res({}));
    const c = createApiClient({ fetch: fetchMock as unknown as typeof fetch });
    await c.getChainInfo();
    expect(fetchMock).toHaveBeenCalledWith('https://api.viz.cx/', expect.anything());
  });
});
