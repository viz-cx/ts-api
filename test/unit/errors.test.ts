import { describe, it, expect } from 'vitest';
import { VizApiError, VizApiHttpError, VizApiAuthError, VizApiTransportError } from '../../src/errors';

describe('errors', () => {
  it('VizApiHttpError carries status and body and is a VizApiError', () => {
    const e = new VizApiHttpError({ status: 500, body: { detail: 'boom' }, message: 'HTTP 500' });
    expect(e).toBeInstanceOf(VizApiError);
    expect(e.name).toBe('VizApiHttpError');
    expect(e.status).toBe(500);
    expect(e.body).toEqual({ detail: 'boom' });
  });

  it('VizApiAuthError defaults status to 401', () => {
    const e = new VizApiAuthError({ message: 'unauthorized' });
    expect(e).toBeInstanceOf(VizApiError);
    expect(e.status).toBe(401);
  });

  it('VizApiTransportError carries cause', () => {
    const cause = new Error('socket');
    const e = new VizApiTransportError({ message: 'net down', cause });
    expect(e).toBeInstanceOf(VizApiError);
    expect(e.cause).toBe(cause);
  });
});
