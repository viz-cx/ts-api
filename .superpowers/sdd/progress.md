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
