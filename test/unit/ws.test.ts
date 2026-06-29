import { describe, it, expect, vi } from 'vitest';
import { createStreamOps } from '../../src/ws';
import { normalizeApiOptions } from '../../src/config';
import type { OpStreamMessage } from '../../src/types';

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(url: string) { this.url = url; FakeWebSocket.last = this; }
  close() { this.closed = true; this.onclose?.(); }
  emit(msg: OpStreamMessage) { this.onmessage?.({ data: JSON.stringify(msg) }); }
}

function streamFactory() {
  const opts = normalizeApiOptions({
    wsUrl: 'wss://api.test/ws/ops',
    WebSocket: FakeWebSocket as unknown as new (url: string) => WebSocket,
  });
  return createStreamOps(opts);
}

const SAMPLE: OpStreamMessage = { opId: '1', timestamp: 't', opType: 'transfer', body: { from: 'a' } };

describe('streamOps', () => {
  it('builds the URL with filter query params', () => {
    const s = streamFactory()({ opType: 'transfer', account: 'alice' });
    expect(FakeWebSocket.last!.url).toBe('wss://api.test/ws/ops?op_type=transfer&account=alice');
    s.close();
  });

  it('delivers parsed messages to on() handlers', () => {
    const s = streamFactory()();
    const got: OpStreamMessage[] = [];
    s.on((m) => got.push(m));
    FakeWebSocket.last!.onopen?.();
    FakeWebSocket.last!.emit(SAMPLE);
    expect(got).toEqual([SAMPLE]);
    s.close();
  });

  it('off() removes a handler', () => {
    const s = streamFactory()();
    const fn = vi.fn();
    s.on(fn);
    s.off(fn);
    FakeWebSocket.last!.emit(SAMPLE);
    expect(fn).not.toHaveBeenCalled();
    s.close();
  });

  it('onStatus reports open then closed', () => {
    const s = streamFactory()();
    const states: string[] = [];
    s.onStatus((st) => states.push(st));
    FakeWebSocket.last!.onopen?.();
    s.close();
    expect(states).toContain('open');
    expect(states).toContain('closed');
  });

  it('async iteration yields messages', async () => {
    const s = streamFactory()();
    FakeWebSocket.last!.onopen?.();
    const it = s[Symbol.asyncIterator]();
    const p = it.next();
    FakeWebSocket.last!.emit(SAMPLE);
    const { value } = await p;
    expect(value).toEqual(SAMPLE);
    s.close();
  });

  it('throws if no WebSocket is available', () => {
    const s = createStreamOps(normalizeApiOptions({ wsUrl: 'wss://api.test/ws/ops' }));
    const orig = (globalThis as { WebSocket?: unknown }).WebSocket;
    (globalThis as { WebSocket?: unknown }).WebSocket = undefined;
    try { expect(() => s()).toThrow(); } finally { (globalThis as { WebSocket?: unknown }).WebSocket = orig; }
  });
});
