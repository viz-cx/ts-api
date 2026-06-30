---
"@viz-cx/api": patch
---

Widen the `@viz-cx/core` peer dependency to `^0.7.0` (was `^0.6.1`) so the
optional `./core-signer` integration aligns with the current core release,
which dropped the runtime `viz-js-lib` dependency. Verified against
`@viz-cx/core@0.7.0`: build, types, 35 tests, exports, and OpenAPI drift all pass.
