---
"@viz-cx/api": patch
---

Fix read-path types for the viz-cpp-node witness→validator migration. The
site API now emits `current_validator` (was `current_witness`) on `GET /`,
and `validators_voted_for` / `validator_votes` (were `witnesses_voted_for` /
`witness_votes`) on `GET /profile/{user}`. The new field names are now the
primary types; the old names are retained as `@deprecated` aliases for
consumers still reading from older nodes.
