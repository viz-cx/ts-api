export class VizApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VizApiError';
  }
}

export class VizApiHttpError extends VizApiError {
  readonly status: number;
  readonly body: unknown;
  constructor(opts: { status: number; body?: unknown; message: string }) {
    super(opts.message);
    this.name = 'VizApiHttpError';
    this.status = opts.status;
    this.body = opts.body;
  }
}

export class VizApiAuthError extends VizApiError {
  readonly status: number;
  constructor(opts: { message: string }) {
    super(opts.message);
    this.name = 'VizApiAuthError';
    this.status = 401;
  }
}

export class VizApiTransportError extends VizApiError {
  override readonly cause?: unknown;
  constructor(opts: { message: string; cause?: unknown }) {
    super(opts.message);
    this.name = 'VizApiTransportError';
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}
