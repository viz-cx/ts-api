# @viz-cx/api

Type-safe TypeScript SDK for the [VIZ](https://viz.cx) site API (`api.viz.cx`): blocks, profiles, richlist, signed webhooks, and the live op WebSocket stream.

## Relationship to @viz-cx/core

`@viz-cx/api` is the **site API SDK** — it talks to the `api.viz.cx` REST/WebSocket service built on top of the VIZ node. `@viz-cx/core` is the **node RPC SDK** — it talks directly to a VIZ node via JSON-RPC. Use `@viz-cx/api` for frontend/app integrations; use `@viz-cx/core` when you need raw chain access, transaction signing, or broadcasts. The two packages are independent; `@viz-cx/core` becomes relevant here only as the optional signer backend.

## Install

```sh
pnpm add @viz-cx/api
# Optional: install @viz-cx/core if you want the batteries-included signer
pnpm add @viz-cx/core
```

## Quickstart

```ts
import { createApiClient } from '@viz-cx/api';

const client = createApiClient();

const info = await client.getChainInfo();
console.log(info?.head_block_number);

const profile = await client.getProfile('alice');
console.log(profile?.balance);

const richlist = await client.getRichlist();
console.log(richlist?.accounts.length); // full snapshot (~14k accounts)

const block = await client.getBlock(81_000_000);
console.log(block?.block.length);
```

## Auth

Signed requests use a nonce-based challenge flow. You provide a `Signer` — any object with `{ account: string, sign(nonceBytes: Uint8Array): string | Promise<string> }`.

### Custom SignFn

```ts
import { createApiClient } from '@viz-cx/api';
import type { SignFn } from '@viz-cx/api';

const mySign: SignFn = (nonceBytes) => {
  // Return a hex-encoded 65-byte recoverable ECDSA signature over sha256(nonceBytes).
  return myHardwareWallet.sign(nonceBytes);
};

const client = createApiClient({
  auth: { account: 'alice', sign: mySign },
});
```

### withCoreSigner (batteries-included)

If `@viz-cx/core` is installed, use `withCoreSigner` from the `@viz-cx/api/core-signer` subpath:

```ts
import { createApiClient } from '@viz-cx/api';
import { withCoreSigner } from '@viz-cx/api/core-signer';

const client = createApiClient({
  auth: withCoreSigner('alice', '5J...privateKey'),
});
```

`withCoreSigner` wraps `keys.sign` from `@viz-cx/core`, which produces a 65-byte recoverable ECDSA signature (hex) over `sha256(nonceBytes)` — the format `api.viz.cx` expects.

## Webhooks CRUD

Webhooks require auth. Pass an `auth` signer in client options or per-call.

```ts
import { createApiClient } from '@viz-cx/api';
import { withCoreSigner } from '@viz-cx/api/core-signer';

const client = createApiClient({
  auth: withCoreSigner('alice', '5J...privateKey'),
});

// Create a webhook (filter is optional)
const created = await client.webhooks.create({
  url: 'https://example.com/hook',
  filter: { opType: 'award', account: 'alice' },
});
console.log(created.id, created.secret);

// List webhooks for this account
const rows = await client.webhooks.list();
rows.forEach((r) => console.log(r.id, r.url, r.active));

// Delete a webhook
await client.webhooks.delete(created.id);
```

## Live op stream (WebSocket)

`client.streamOps(filter?)` returns an `OpStream` — a reconnecting WebSocket client that is also an `AsyncIterable`.

### Callback style

```ts
const stream = client.streamOps({ opType: 'award' });

const unsub = stream.on((msg) => {
  console.log(msg.opType, msg.body);
});

stream.onStatus((s) => console.log('status:', s)); // 'open' | 'reconnecting' | 'closed'

// Later:
unsub();
stream.close();
```

### Async iterator style

```ts
const stream = client.streamOps();
for await (const msg of stream) {
  console.log(msg.opType, msg.body);
  if (someCondition) break; // break calls stream.close() automatically
}
```

### Node.js WebSocket injection

The browser `WebSocket` global is used by default. In Node.js (< 22), inject one explicitly:

```ts
import { createApiClient } from '@viz-cx/api';
import { WebSocket } from 'ws';

const client = createApiClient({ WebSocket });
const stream = client.streamOps();
```

## API reference

```ts
interface ApiClient {
  getChainInfo(): Promise<ChainInfo | null>;
  getLatestBlock(): Promise<BlockDoc | null>;
  getBlock(id: number): Promise<BlockDoc | null>;
  getProfile(user: string): Promise<Profile | null>;
  getRichlist(): Promise<Richlist | null>;
  avatarUrl(user: string): string;
  webhooks: {
    create(input: { url: string; filter?: WebhookFilter }, signer?: Signer): Promise<WebhookCreated>;
    list(signer?: Signer): Promise<WebhookRow[]>;
    delete(id: string, signer?: Signer): Promise<{ ok: true }>;
  };
  streamOps(filter?: WebhookFilter): OpStream;
  fetchNonce(): Promise<string>;
  authedFetch(path: string, init: RequestInit, signer?: Signer): Promise<Response>;
}
```

## Options

```ts
createApiClient({
  baseUrl?: string;        // default: 'https://api.viz.cx'
  wsUrl?: string;          // default: 'wss://api.viz.cx/ws/ops'
  auth?: Signer;           // default signer for authed calls
  WebSocket?: WebSocketCtor; // WebSocket constructor (Node.js injection)
  fetch?: typeof fetch;    // custom fetch implementation
})
```

## License

MIT
