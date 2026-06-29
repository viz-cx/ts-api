import type { NormalizedApiOptions } from './config';
import type { Auth } from './auth';
import { VizApiHttpError } from './errors';
import type { Signer, WebhookCreated, WebhookFilter, WebhookRow } from './types';

interface WireFilter { op_type?: string; account?: string }
interface WireRow { id: string; url: string; filter?: WireFilter; created_at: string; active: boolean }

function filterToWire(f?: WebhookFilter): WireFilter {
  const out: WireFilter = {};
  if (f?.opType !== undefined) out.op_type = f.opType;
  if (f?.account !== undefined) out.account = f.account;
  return out;
}

function rowFromWire(r: WireRow): WebhookRow {
  const filter: WebhookFilter = {};
  if (r.filter?.op_type !== undefined) filter.opType = r.filter.op_type;
  if (r.filter?.account !== undefined) filter.account = r.filter.account;
  return { id: r.id, url: r.url, filter, createdAt: r.created_at, active: r.active };
}

async function readJson<T>(res: Response, ctx: string): Promise<T> {
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = undefined; }
    throw new VizApiHttpError({ status: res.status, body, message: `HTTP ${res.status} on ${ctx}` });
  }
  return (await res.json()) as T;
}

// `opts` is accepted for symmetry with sibling factories; webhook paths are
// relative and resolved by auth.authedFetch, so it is currently unused. It sits
// before the used `auth` param, so eslint's after-used rule does not flag it.
export function createWebhooks(_opts: NormalizedApiOptions, auth: Auth) {
  async function create(input: { url: string; filter?: WebhookFilter }, signer?: Signer): Promise<WebhookCreated> {
    const res = await auth.authedFetch('/webhooks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: input.url, filter: filterToWire(input.filter) }),
    }, signer);
    return readJson<WebhookCreated>(res, 'POST /webhooks');
  }

  async function list(signer?: Signer): Promise<WebhookRow[]> {
    const res = await auth.authedFetch('/webhooks', { method: 'GET' }, signer);
    const rows = await readJson<WireRow[]>(res, 'GET /webhooks');
    return rows.map(rowFromWire);
  }

  async function del(id: string, signer?: Signer): Promise<{ ok: true }> {
    const res = await auth.authedFetch(`/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' }, signer);
    return readJson<{ ok: true }>(res, `DELETE /webhooks/${id}`);
  }

  return { create, list, delete: del };
}

export type Webhooks = ReturnType<typeof createWebhooks>;
