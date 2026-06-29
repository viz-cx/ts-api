import type { NormalizedApiOptions, WebSocketCtor } from './config';
import type { OpStreamMessage, WebhookFilter } from './types';

export type StreamStatus = 'open' | 'reconnecting' | 'closed';

export interface OpStream extends AsyncIterable<OpStreamMessage> {
  on(handler: (msg: OpStreamMessage) => void): () => void;
  off(handler: (msg: OpStreamMessage) => void): void;
  onStatus(handler: (s: StreamStatus) => void): () => void;
  close(): void;
}

const BACKOFF_BASE = 500;
const BACKOFF_CAP = 15_000;

function buildUrl(wsUrl: string, filter?: WebhookFilter): string {
  const params = new URLSearchParams();
  if (filter?.opType) params.set('op_type', filter.opType);
  if (filter?.account) params.set('account', filter.account);
  const qs = params.toString();
  return qs ? `${wsUrl}?${qs}` : wsUrl;
}

export function createStreamOps(opts: NormalizedApiOptions) {
  return function streamOps(filter?: WebhookFilter): OpStream {
    const maybeCtor: WebSocketCtor | undefined =
      opts.WebSocket ?? (globalThis as { WebSocket?: WebSocketCtor }).WebSocket;
    if (!maybeCtor) throw new Error('No WebSocket implementation available — pass one via client options.');
    const Ctor: WebSocketCtor = maybeCtor;

    const url = buildUrl(opts.wsUrl, filter);
    const msgHandlers = new Set<(m: OpStreamMessage) => void>();
    const statusHandlers = new Set<(s: StreamStatus) => void>();
    // Pending queue + waiters bridge push-events to the async iterator.
    const queue: OpStreamMessage[] = [];
    const waiters: Array<(r: IteratorResult<OpStreamMessage>) => void> = [];

    let ws: WebSocket | null = null;
    let backoff = BACKOFF_BASE;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const emitStatus = (s: StreamStatus) => statusHandlers.forEach((h) => h(s));

    function deliver(msg: OpStreamMessage) {
      msgHandlers.forEach((h) => h(msg));
      const w = waiters.shift();
      if (w) w({ value: msg, done: false });
      else queue.push(msg);
    }

    function connect() {
      if (stopped) return;
      ws = new Ctor(url);
      ws.onopen = () => { backoff = BACKOFF_BASE; emitStatus('open'); };
      ws.onmessage = (ev: MessageEvent) => {
        try { deliver(JSON.parse(String(ev.data)) as OpStreamMessage); } catch { /* drop malformed */ }
      };
      ws.onclose = () => {
        if (stopped) return;
        emitStatus('reconnecting');
        timer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, BACKOFF_CAP);
      };
      ws.onerror = () => { try { ws?.close(); } catch { /* ignore */ } };
    }

    function close() {
      if (stopped) return;
      stopped = true;
      if (timer) clearTimeout(timer);
      try { ws?.close(); } catch { /* ignore */ }
      emitStatus('closed');
      // Resolve any pending iterator waiters as done.
      while (waiters.length) waiters.shift()!({ value: undefined as never, done: true });
    }

    connect();

    return {
      on(handler) { msgHandlers.add(handler); return () => msgHandlers.delete(handler); },
      off(handler) { msgHandlers.delete(handler); },
      onStatus(handler) { statusHandlers.add(handler); return () => statusHandlers.delete(handler); },
      close,
      [Symbol.asyncIterator](): AsyncIterator<OpStreamMessage> {
        return {
          next(): Promise<IteratorResult<OpStreamMessage>> {
            if (queue.length) return Promise.resolve({ value: queue.shift()!, done: false });
            if (stopped) return Promise.resolve({ value: undefined as never, done: true });
            return new Promise((resolve) => waiters.push(resolve));
          },
          return(): Promise<IteratorResult<OpStreamMessage>> {
            close();
            return Promise.resolve({ value: undefined as never, done: true });
          },
        };
      },
    };
  };
}

export type StreamOps = ReturnType<typeof createStreamOps>;
