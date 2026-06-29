# Repository guide for AI agents

This file orients Claude Code, Codex, Cursor, and any other AI coding agent working in `@viz-cx/api`.

## Project in one paragraph

`@viz-cx/api` is a type-safe TypeScript SDK for the VIZ site API (`api.viz.cx`). It provides a `createApiClient()` factory that exposes REST getters (blocks, profiles, richlist, chain info), a nonce-based signed-request auth helper, webhooks CRUD, and a reconnecting WebSocket op-stream client (`streamOps`) that doubles as an `AsyncIterable`. The package is dual ESM+CJS, has no runtime dependencies, and exposes an optional `@viz-cx/core` peer dependency via the `./core-signer` subpath for batteries-included ECDSA signing.

## Commands

| Goal | Command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Build (dual ESM+CJS via tsup) | `pnpm build` |
| Unit tests | `pnpm test` |
| Type-level tests (tsd) | `pnpm build && pnpm test:types` (build first — tsd reads `dist/index.d.ts`) |
| Lint | `pnpm lint` |
| Typecheck | `pnpm lint:types` |
| Exports sanity (arethetypeswrong) | `pnpm lint:exports` |
| OpenAPI drift guard | `pnpm drift` |
| Tarball size budget | `pnpm size` |
| Smoke test against live API | `pnpm smoke` |
| Pre-publish gate | `pnpm prepublishOnly` |

Use **pnpm**, not npm — lockfile is `pnpm-lock.yaml`. `pnpm test:types` requires `dist/` — always run `pnpm build` first. CI matrix does this.

## Source layout

```
src/
  index.ts          public exports (the published API surface)
  client.ts         createApiClient(), ApiClient interface
  rest.ts           REST transport: getChainInfo, getBlock, getProfile, getRichlist, avatarUrl
  auth.ts           nonce fetch, signed-request helper (authedFetch), Signer resolution
  webhooks.ts       webhooks.create / list / delete — camel↔snake at wire boundary
  ws.ts             createStreamOps(), OpStream (reconnecting WebSocket + AsyncIterable)
  config.ts         ApiClientOptions, normalizeApiOptions, DEFAULT_API_BASE, DEFAULT_WS_URL
  errors.ts         VizApiError, VizApiHttpError, VizApiAuthError, VizApiTransportError
  types.ts          RawOp, OpRecord, BlockDoc, ChainInfo, RichlistRow, Richlist, Profile,
                    WebhookFilter, WebhookCreated, WebhookRow, OpStreamMessage, SignFn, Signer
  core-signer.ts    withCoreSigner() — wraps @viz-cx/core keys.sign (optional peer dep)
  version.ts        VERSION constant (re-exported)

scripts/
  check-openapi-drift.mjs   fetches live OpenAPI spec, diffs against src/types.ts
  check-tarball-size.mjs    pnpm pack → asserts size < 50 KB
  smoke-test.mjs            live read against api.viz.cx (requires network)

test/
  unit/             vitest unit tests — one file per src module
  types/            tsd type-level assertions (require dist/)
  integration/      live-API integration tests (gated, off by default)
```

## Key invariants

- **No runtime dependencies.** `@viz-cx/core` is an optional `peerDependency` accessed only via the `./core-signer` subpath. Don't add `dependencies` without strong justification — the 50 KB tarball budget is enforced by `pnpm size`.
- **camelCase in source, snake_case at the wire boundary.** `webhooks.ts` and `rest.ts` translate between camelCase TypeScript types and snake_case JSON. Do not leak snake_case field names into public types or method signatures.
- **Signing format.** `SignFn` receives a `Uint8Array` (the nonce bytes) and must return a hex-encoded 65-byte recoverable ECDSA signature over `sha256(nonceBytes)`. `withCoreSigner` from `./core-signer` handles this via `@viz-cx/core`'s `keys.sign`.
- **WebSocket is injectable.** `createApiClient({ WebSocket })` accepts any constructor compatible with the browser `WebSocket` interface. Node.js users inject `ws` this way; browser users rely on the global.
- **`streamOps` is an `AsyncIterable`.** Breaking the `for await` loop automatically calls `stream.close()` via the iterator's `return()` method. Don't remove that hook.
- **`@viz-cx/core` is a peer dep, not a direct dep.** The `./core-signer` subpath imports from `@viz-cx/core`. This import must never appear anywhere else in the source tree.

## Release process

- Versioning via **Changesets**. To ship a change: `pnpm changeset` (or hand-write `.changeset/<slug>.md`) → push.
- `changesets/action@v1` opens a "Version Packages" PR that bumps `package.json` + `CHANGELOG.md` and deletes consumed changesets.
- Merging that PR triggers `release.yml`, which compares local version vs npm and publishes the delta via **npm Trusted Publisher (OIDC)** — no `NPM_TOKEN` involved.
- Required workflow perms: `id-token: write`, `contents: write`, `pull-requests: write`.

## Gotchas / footguns

- Running `npm install` (instead of `pnpm install`) writes a `package-lock.json` and corrupts the dep graph. If it ever appears, delete it and re-run `pnpm install --lockfile-only`.
- `pnpm smoke` requires a live network connection to `api.viz.cx` — it is not run in offline/isolated environments.
- `pnpm drift` fetches the live OpenAPI spec from `api.viz.cx/openapi.json` — same network requirement.
- The pnpm lockfile is in pnpm 11 format locally (pnpm 11.2.2); CI pins pnpm 10.34.4. If CI lockfile compatibility breaks, regenerate with `pnpm install --lockfile-only` under pnpm 10.
