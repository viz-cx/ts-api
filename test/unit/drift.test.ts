import { describe, it, expect } from 'vitest';
import { checkDrift, REQUIRED_PATHS } from '../../scripts/check-openapi-drift.mjs';

describe('checkDrift', () => {
  it('passes when every required path is present', () => {
    const spec = { paths: Object.fromEntries(REQUIRED_PATHS.map((p) => [p, {}])) };
    expect(checkDrift(spec)).toEqual({ ok: true, missing: [] });
  });

  it('reports missing required paths', () => {
    const spec = { paths: { '/richlist': {} } };
    const result = checkDrift(spec);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('/profile/{user}');
  });
});
