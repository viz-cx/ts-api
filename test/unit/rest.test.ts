import { describe, it, expect, vi } from 'vitest';
import { createRest } from '../../src/rest';
import { normalizeApiOptions } from '../../src/config';
import { VizApiHttpError, VizApiTransportError } from '../../src/errors';

function restWith(fetchImpl: typeof fetch) {
  return createRest(normalizeApiOptions({ baseUrl: 'https://api.test', fetch: fetchImpl }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('rest getters', () => {
  it('getProfile returns parsed body and hits the right URL', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ name: 'alice', id: 1 }));
    const rest = restWith(fetchMock as unknown as typeof fetch);
    const p = await rest.getProfile('alice');
    expect(p?.name).toBe('alice');
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/profile/alice', expect.anything());
  });

  it('getProfile returns null on 404', async () => {
    const rest = restWith((async () => jsonResponse({ detail: 'nope' }, 404)) as unknown as typeof fetch);
    expect(await rest.getProfile('ghost')).toBeNull();
  });

  it('throws VizApiHttpError on 500', async () => {
    const rest = restWith((async () => jsonResponse({ detail: 'boom' }, 500)) as unknown as typeof fetch);
    await expect(rest.getChainInfo()).rejects.toBeInstanceOf(VizApiHttpError);
  });

  it('throws VizApiTransportError when fetch rejects', async () => {
    const rest = restWith((async () => { throw new Error('socket'); }) as unknown as typeof fetch);
    await expect(rest.getRichlist()).rejects.toBeInstanceOf(VizApiTransportError);
  });

  it('encodes the username in the path', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ name: 'a b' }));
    const rest = restWith(fetchMock as unknown as typeof fetch);
    await rest.getProfile('a b');
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/profile/a%20b', expect.anything());
  });

  it('avatarUrl builds an absolute URL without fetching', () => {
    const rest = restWith((async () => jsonResponse({})) as unknown as typeof fetch);
    expect(rest.avatarUrl('alice')).toBe('https://api.test/profile/avatar/alice');
  });

  it('getBlock requests the numeric id', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ _id: 42, block: [] }));
    const rest = restWith(fetchMock as unknown as typeof fetch);
    const b = await rest.getBlock(42);
    expect(b?._id).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/blocks/42', expect.anything());
  });
});
