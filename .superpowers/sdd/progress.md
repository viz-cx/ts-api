# @viz-cx/api SDD Progress Ledger

Plan: ~/Develop/Pet/Journal/Projects/viz.cx/plans/2026-06-29-viz-cx-api-sdk.md
Repo: /Users/babin/Develop/VIZ/ts-api

## Completed Tasks

- **Task 1: Repo scaffold + build pipeline** — commit `1a8c23c`. Repo skeleton
  with package.json, tsconfig.json, tsup.config.ts (two entries: index +
  core-signer placeholder), vitest config, eslint config, pnpm-workspace.yaml.
  `pnpm test` / `lint:types` / `build` / `lint:exports` all green. Deviation:
  added an `fflate: 0.8.2` override in `pnpm-workspace.yaml` to work around an
  upstream `@arethetypeswrong/core@0.15.1` crash under `fflate@0.8.3` (see
  task-1-report.md for full repro). `attw` correctly flags
  `@viz-cx/api/core-signer` as `node10: Resolution failed` — expected per the
  brief since core-signer is an empty placeholder until Task 7.
Task 1: complete (commits 4b825dc..4dc428e, review clean)
  Minor: pnpm lockfile is pnpm11 format — verify compat with pnpm 10.34.4 in CI (Task 12)
  Minor: README.md referenced in files[] but absent — expected, Task 12 adds it
Task 2: complete (commits 4dc428e..7f082fb, review clean)
Task 3: complete (commits 7f082fb..80c56c3, review clean)
Task 4: complete (commits 80c56c3..b5fe870, review clean)
Task 5: complete (commits b5fe870..90da77e, review clean)
  Minor: fetchNonce non-2xx → VizApiHttpError, not VizApiAuthError (plan-mandated, untested path)
Task 6: complete (commit 6c30c34) — webhooks CRUD with camel↔snake wire conversion
Task 6: complete (commits 90da77e..6c30c34, review clean)
Task 7: complete (commits 6c30c34..71117b6, review clean)
Task 8: complete (commits 71117b6..bac60b6, review clean)
  Minor: ws ref not nulled after close() (cosmetic, stopped flag guards all behavior)
  Minor: empty-string filter values dropped (truthy check, matches brief/tests)
  Minor: onerror → reconnecting status only; no distinct error vs clean-close discrimination
Task 9: complete (commits bac60b6..HEAD, review clean) — createApiClient assembles rest/auth/webhooks/streamOps; src/index.ts finalized as full public surface
  Minor: attw flags @viz-cx/api/core-signer node10 Resolution failed — pre-existing since Task 7, not a Task 9 regression (verified via git stash diff)
