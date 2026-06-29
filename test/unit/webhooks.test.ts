import { describe, it, expect, vi } from 'vitest';
import { createWebhooks } from '../../src/webhooks';
import { createAuth } from '../../src/auth';
import { normalizeApiOptions } from '../../src/config';

function res(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function setup(handler: (url: string, init: RequestInit) => Response) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) =>
    url.endsWith('/auth/nonce') ? res({ nonce: 'N' }) : handler(url, init),
  );
  const opts = normalizeApiOptions({
    baseUrl: 'https://api.test', fetch: fetchMock as unknown as typeof fetch,
    auth: { account: 'alice', sign: () => 'sig' },
  });
  return { fetchMock, webhooks: createWebhooks(opts, createAuth(opts)) };
}

describe('webhooks', () => {
  it('create sends snake_case filter and returns id+secret', async () => {
    let sentBody: unknown;
    const { webhooks } = setup((url, init) => {
      if (url.endsWith('/webhooks') && init.method === 'POST') {
        sentBody = JSON.parse(init.body as string);
        return res({ id: 'wh_1', secret: 's3cret' }, 200);
      }
      return res({}, 500);
    });
    const created = await webhooks.create({ url: 'https://hook.test', filter: { opType: 'transfer', account: 'bob' } });
    expect(created).toEqual({ id: 'wh_1', secret: 's3cret' });
    expect(sentBody).toEqual({ url: 'https://hook.test', filter: { op_type: 'transfer', account: 'bob' } });
  });

  it('list maps created_at → createdAt', async () => {
    const { webhooks } = setup((url, init) =>
      url.endsWith('/webhooks') && (init.method ?? 'GET') === 'GET'
        ? res([{ id: 'wh_1', url: 'https://h.test', filter: { op_type: 'transfer' }, created_at: '2026-01-01T00:00:00Z', active: true }])
        : res({}, 500),
    );
    const rows = await webhooks.list();
    expect(rows[0]).toEqual({
      id: 'wh_1', url: 'https://h.test', filter: { opType: 'transfer' },
      createdAt: '2026-01-01T00:00:00Z', active: true,
    });
  });

  it('delete hits DELETE /webhooks/{id}', async () => {
    let method = ''; let path = '';
    const { webhooks } = setup((url, init) => {
      method = init.method ?? ''; path = url;
      return res({ ok: true });
    });
    const out = await webhooks.delete('wh_9');
    expect(out).toEqual({ ok: true });
    expect(method).toBe('DELETE');
    expect(path).toBe('https://api.test/webhooks/wh_9');
  });
});
