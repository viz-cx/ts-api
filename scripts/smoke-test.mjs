// Minimal live read against api.viz.cx to catch gross breakage post-build.
import { createApiClient } from '../dist/index.js';

const client = createApiClient();
const info = await client.getChainInfo();
if (!info || typeof info.head_block_number !== 'number') {
  console.error('smoke: getChainInfo did not return a head_block_number', info);
  process.exit(1);
}
const rich = await client.getRichlist();
if (!rich || !Array.isArray(rich.accounts)) {
  console.error('smoke: getRichlist did not return accounts', rich);
  process.exit(1);
}
console.log(`smoke OK — head_block_number=${info.head_block_number}, richlist=${rich.accounts.length} accounts`);
