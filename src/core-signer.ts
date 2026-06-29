import { keys } from '@viz-cx/core';
import type { Signer } from './types';

/**
 * Batteries-included signer that wraps `@viz-cx/core`'s `keys.sign`.
 *
 * `keys.sign(bytes, wif)` returns a 65-byte recoverable ECDSA signature (hex)
 * over `sha256(bytes)` — exactly the format the site API's graphene
 * `verify_message(nonce_bytes, sig)` recovers a public key from. Requires
 * `@viz-cx/core` to be installed (it is an optional peer dependency).
 */
export function withCoreSigner(account: string, wif: string): Signer {
  return {
    account,
    sign: (nonceBytes: Uint8Array) => keys.sign(nonceBytes, wif),
  };
}
