import { describe, it, expect } from 'vitest';
import { withCoreSigner } from '../../src/core-signer';
import { keys } from '@viz-cx/core';

describe('withCoreSigner', () => {
  // A deterministic regular-role WIF derived from a throwaway brain key.
  const wif = keys.fromPassword('tester', 'P5JTestPasswordForUnit12345', 'regular');

  it('returns a Signer with the given account and a sign fn', () => {
    const s = withCoreSigner('tester', wif);
    expect(s.account).toBe('tester');
    expect(typeof s.sign).toBe('function');
  });

  it('produces a 65-byte (130 hex char) recoverable signature over the nonce bytes', async () => {
    const s = withCoreSigner('tester', wif);
    const sig = await s.sign(new TextEncoder().encode('NONCE_ABC'));
    expect(sig).toMatch(/^[0-9a-f]{130}$/);
  });

  it('the produced signature verifies back to the signer pubkey via core keys.verify', async () => {
    const s = withCoreSigner('tester', wif);
    const nonceBytes = new TextEncoder().encode('NONCE_ABC');
    const sig = await s.sign(nonceBytes);
    const pub = keys.toPublic(wif);
    expect(keys.verify(nonceBytes, sig, pub)).toBe(true);
  });
});
