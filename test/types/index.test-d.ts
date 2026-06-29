import { expectType, expectAssignable } from 'tsd';
import { createApiClient } from '../../dist/index';
import type { ApiClient, Profile, OpStreamMessage, Signer, WebhookCreated } from '../../dist/index';

const client: ApiClient = createApiClient();

// getProfile resolves to Profile | null
expectType<Promise<Profile | null>>(client.getProfile('alice'));

// avatarUrl is sync string
expectType<string>(client.avatarUrl('alice'));

// streamOps message type
const stream = client.streamOps({ opType: 'transfer' });
stream.on((m) => expectType<OpStreamMessage>(m));
stream.close();

// a plain object is an acceptable Signer
expectAssignable<Signer>({ account: 'a', sign: () => 'hex' });
expectAssignable<Signer>({ account: 'a', sign: async () => 'hex' });

// webhooks.create resolves to WebhookCreated
expectType<Promise<WebhookCreated>>(client.webhooks.create({ url: 'https://h.test' }));
