import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Endpoints the SDK reads/writes. If the server removes/renames one, fail loud.
export const REQUIRED_PATHS = [
  '/',
  '/blocks/latest',
  '/blocks/{id}',
  '/profile/{user}',
  '/profile/avatar/{user}',
  '/richlist',
  '/auth/nonce',
  '/webhooks/',
  '/webhooks/{webhook_id}',
];

export function checkDrift(spec) {
  const paths = spec?.paths ?? {};
  const missing = REQUIRED_PATHS.filter((p) => !(p in paths));
  return { ok: missing.length === 0, missing };
}

// CLI entry: compare against the committed snapshot.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const spec = JSON.parse(readFileSync(new URL('../openapi.snapshot.json', import.meta.url), 'utf8'));
  const { ok, missing } = checkDrift(spec);
  if (!ok) {
    console.error('OpenAPI drift — required paths missing from snapshot:\n  ' + missing.join('\n  '));
    process.exit(1);
  }
  console.log(`OpenAPI drift check OK — ${REQUIRED_PATHS.length} required paths present.`);
}
