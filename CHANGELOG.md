# @viz-cx/api

## 0.1.3

### Patch Changes

- 4541804: Widen the `@viz-cx/core` peer dependency to `^0.7.0` (was `^0.6.1`) so the
  optional `./core-signer` integration aligns with the current core release,
  which dropped the runtime `viz-js-lib` dependency. Verified against
  `@viz-cx/core@0.7.0`: build, types, 35 tests, exports, and OpenAPI drift all pass.

## 0.1.2

### Patch Changes

- 071a2fd: Generate the exported `VERSION` constant from `package.json` at build time so it can no longer drift from the published package version (it was stuck at `0.1.0`). Also correct the package `author` and `LICENSE` copyright contact email.

## 0.1.1

### Patch Changes

- 4de5979: Validate the npm Trusted Publisher (OIDC) release pipeline with a first automated, tokenless, provenance-signed publish.
