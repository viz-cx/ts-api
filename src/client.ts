import type { ApiClientOptions } from './config';
import { normalizeApiOptions } from './config';
import { createRest } from './rest';
import { createAuth } from './auth';
import { createWebhooks, type Webhooks } from './webhooks';
import { createStreamOps, type StreamOps } from './ws';
import type { BlockDoc, ChainInfo, Profile, Richlist } from './types';

export interface ApiClient {
  getChainInfo(): Promise<ChainInfo | null>;
  getLatestBlock(): Promise<BlockDoc | null>;
  getBlock(id: number): Promise<BlockDoc | null>;
  getProfile(user: string): Promise<Profile | null>;
  getRichlist(): Promise<Richlist | null>;
  avatarUrl(user: string): string;
  webhooks: Webhooks;
  streamOps: StreamOps;
  fetchNonce(): Promise<string>;
  authedFetch: ReturnType<typeof createAuth>['authedFetch'];
}

export function createApiClient(opts: ApiClientOptions = {}): ApiClient {
  const normalized = normalizeApiOptions(opts);
  const rest = createRest(normalized);
  const auth = createAuth(normalized);
  const webhooks = createWebhooks(normalized, auth);
  const streamOps = createStreamOps(normalized);

  return {
    getChainInfo: rest.getChainInfo,
    getLatestBlock: rest.getLatestBlock,
    getBlock: rest.getBlock,
    getProfile: rest.getProfile,
    getRichlist: rest.getRichlist,
    avatarUrl: rest.avatarUrl,
    webhooks,
    streamOps,
    fetchNonce: auth.fetchNonce,
    authedFetch: auth.authedFetch,
  };
}
