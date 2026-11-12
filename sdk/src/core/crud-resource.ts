import { HttpClient, QueryValue } from './http-client';
import type { Paginated } from '../types/common';

export interface CallOptions {
  signal?: AbortSignal;
}

export const toQuery = (params?: object): Record<string, QueryValue> | undefined =>
  params as Record<string, QueryValue> | undefined;

export class CrudResource<TItem, TListParams extends object, TCreate, TUpdate> {
  constructor(
    protected readonly http: HttpClient,
    protected readonly path: string,
  ) {}

  list(params?: TListParams, options: CallOptions = {}): Promise<Paginated<TItem>> {
    return this.http.request<Paginated<TItem>>(this.path, {
      method: 'GET',
      query: toQuery(params),
      signal: options.signal,
    });
  }

  get(id: number, options: CallOptions = {}): Promise<TItem> {
    return this.http.request<TItem>(`${this.path}/${id}`, { method: 'GET', signal: options.signal });
  }

  create(input: TCreate): Promise<TItem> {
    return this.http.request<TItem>(this.path, { method: 'POST', body: input });
  }

  update(id: number, input: TUpdate): Promise<TItem> {
    return this.http.request<TItem>(`${this.path}/${id}`, { method: 'PATCH', body: input });
  }

  remove(id: number): Promise<void> {
    return this.http.request<void>(`${this.path}/${id}`, { method: 'DELETE' });
  }
}
