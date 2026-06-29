import { describe, it, expect } from 'vitest';
import { createApiClient } from '../../src/index';
import { withCoreSigner } from '../../src/core-signer';

const ACCOUNT = process.env.VIZ_TEST_ACCOUNT;
const WIF = process.env.VIZ_TEST_WIF; // a regular-authority WIF for ACCOUNT

describe('live REST', () => {
  it('getChainInfo returns a head block number', async () => {
    const info = await createApiClient().getChainInfo();
    expect(typeof info?.head_block_number).toBe('number');
  });

  it('getRichlist returns accounts', async () => {
    const rich = await createApiClient().getRichlist();
    expect(Array.isArray(rich?.accounts)).toBe(true);
  });

  it('getProfile returns null for a non-existent account', async () => {
    expect(await createApiClient().getProfile('definitely-not-an-account-xyz')).toBeNull();
  });
});

describe('live WS', () => {
  it('connects and reports open within 10s', async () => {
    const client = createApiClient();
    const stream = client.streamOps();
    const opened = await new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(false), 10_000);
      stream.onStatus((s) => { if (s === 'open') { clearTimeout(t); resolve(true); } });
    });
    stream.close();
    expect(opened).toBe(true);
  });
});

describe.runIf(ACCOUNT && WIF)('live webhook signing round-trip', () => {
  it('creates, lists, and deletes a webhook with a real signature', async () => {
    const client = createApiClient({ auth: withCoreSigner(ACCOUNT!, WIF!) });
    const created = await client.webhooks.create({ url: 'https://example.com/viz-test-hook', filter: { opType: 'transfer' } });
    expect(created.id).toBeTruthy();
    expect(created.secret).toBeTruthy();

    const rows = await client.webhooks.list();
    expect(rows.some((r) => r.id === created.id)).toBe(true);

    const del = await client.webhooks.delete(created.id);
    expect(del.ok).toBe(true);
  });
});
