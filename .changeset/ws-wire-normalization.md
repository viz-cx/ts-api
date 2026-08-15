---
'@viz-cx/api': patch
---

Fix `streamOps` delivering raw snake_case wire JSON (`op_type`, `op_id`) instead of the camelCase `OpStreamMessage` the types promise. Every consumer reading `msg.opType` got `undefined` for all messages. Wire fields are now translated at the boundary, matching the webhooks module.
