# @viz-cx/api

## 0.1.2

### Patch Changes

- 071a2fd: Generate the exported `VERSION` constant from `package.json` at build time so it can no longer drift from the published package version (it was stuck at `0.1.0`). Also correct the package `author` and `LICENSE` copyright contact email.

## 0.1.1

### Patch Changes

- 4de5979: Validate the npm Trusted Publisher (OIDC) release pipeline with a first automated, tokenless, provenance-signed publish.
