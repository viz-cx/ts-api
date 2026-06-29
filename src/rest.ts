import type { NormalizedApiOptions } from './config';
import { VizApiHttpError, VizApiTransportError } from './errors';
import type { BlockDoc, ChainInfo, Profile, Richlist } from './types';

export function createRest(opts: NormalizedApiOptions) {
  const { baseUrl, fetch: fetchFn } = opts;

  async function restGet<T>(path: string): Promise<T | null> {
    let res: Response;
    try {
      res = await fetchFn(`${baseUrl}${path}`, { method: 'GET' });
    } catch (e) {
      throw new VizApiTransportError({ message: `GET ${path} failed`, cause: e });
    }
    if (res.status === 404) return null;
    if (!res.ok) {
      let body: unknown;
      try { body = await res.json(); } catch { body = undefined; }
      throw new VizApiHttpError({ status: res.status, body, message: `HTTP ${res.status} on GET ${path}` });
    }
    try {
      return (await res.json()) as T;
    } catch (e) {
      throw new VizApiTransportError({ message: `Malformed JSON for GET ${path}`, cause: e });
    }
  }

  const enc = encodeURIComponent;

  return {
    restGet,
    getChainInfo: () => restGet<ChainInfo>('/'),
    getLatestBlock: () => restGet<BlockDoc>('/blocks/latest'),
    getBlock: (id: number) => restGet<BlockDoc>(`/blocks/${id}`),
    getProfile: (user: string) => restGet<Profile>(`/profile/${enc(user)}`),
    getRichlist: () => restGet<Richlist>('/richlist'),
    avatarUrl: (user: string) => `${baseUrl}/profile/avatar/${enc(user)}`,
  };
}

export type Rest = ReturnType<typeof createRest>;
