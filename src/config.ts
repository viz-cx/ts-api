import type { Signer } from './types';

export const DEFAULT_API_BASE = 'https://api.viz.cx';
export const DEFAULT_WS_URL = 'wss://api.viz.cx/ws/ops';

export type WebSocketCtor = new (url: string) => WebSocket;

export interface ApiClientOptions {
  baseUrl?: string;
  wsUrl?: string;
  fetch?: typeof fetch;
  WebSocket?: WebSocketCtor;
  auth?: Signer;
}

export interface NormalizedApiOptions {
  baseUrl: string;
  wsUrl: string;
  fetch: typeof fetch;
  WebSocket?: WebSocketCtor;
  auth?: Signer;
}

export function normalizeApiOptions(opts: ApiClientOptions): NormalizedApiOptions {
  const out: NormalizedApiOptions = {
    baseUrl: (opts.baseUrl ?? DEFAULT_API_BASE).replace(/\/$/, ''),
    wsUrl: opts.wsUrl ?? DEFAULT_WS_URL,
    fetch: opts.fetch ?? globalThis.fetch,
  };
  if (opts.WebSocket !== undefined) out.WebSocket = opts.WebSocket;
  if (opts.auth !== undefined) out.auth = opts.auth;
  return out;
}
