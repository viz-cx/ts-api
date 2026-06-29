import type { NormalizedApiOptions } from './config';
import type { Signer } from './types';
import { VizApiAuthError, VizApiHttpError, VizApiTransportError } from './errors';

export function createAuth(opts: NormalizedApiOptions) {
  const { baseUrl, fetch: fetchFn } = opts;

  async function fetchNonce(): Promise<string> {
    let res: Response;
    try {
      res = await fetchFn(`${baseUrl}/auth/nonce`, { method: 'POST' });
    } catch (e) {
      throw new VizApiTransportError({ message: 'POST /auth/nonce failed', cause: e });
    }
    if (!res.ok) {
      throw new VizApiHttpError({ status: res.status, message: `HTTP ${res.status} on /auth/nonce` });
    }
    const body = (await res.json()) as { nonce?: string };
    if (!body.nonce) throw new VizApiTransportError({ message: '/auth/nonce returned no nonce' });
    return body.nonce;
  }

  async function authedFetch(path: string, init: RequestInit, signer?: Signer): Promise<Response> {
    const s = signer ?? opts.auth;
    if (!s) throw new VizApiAuthError({ message: 'No signer configured for authenticated request' });

    const nonce = await fetchNonce();
    const sig = await s.sign(new TextEncoder().encode(nonce));

    const headers = new Headers(init.headers);
    headers.set('X-Auth-Account', s.account);
    headers.set('X-Auth-Nonce', nonce);
    headers.set('X-Auth-Signature', sig);

    let res: Response;
    try {
      res = await fetchFn(`${baseUrl}${path}`, { ...init, headers });
    } catch (e) {
      throw new VizApiTransportError({ message: `${init.method ?? 'GET'} ${path} failed`, cause: e });
    }
    if (res.status === 401) {
      let detail = 'Authentication failed';
      try { detail = ((await res.json()) as { detail?: string }).detail ?? detail; } catch { /* ignore */ }
      throw new VizApiAuthError({ message: detail });
    }
    return res;
  }

  return { fetchNonce, authedFetch };
}

export type Auth = ReturnType<typeof createAuth>;
