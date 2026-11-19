import type { HttpClient } from './http-client';

export interface CallOptions {
  signal?: AbortSignal;
}

export class ApiResource {
  constructor(
    protected readonly http: HttpClient,
    protected readonly path: string,
  ) {}
}
