import { ApiResource, CallOptions } from './api-resource';
import type { Paginated } from '../types/common';

export type { CallOptions } from './api-resource';

export class ReadResource<TItem, TListParams extends object> extends ApiResource {
  list(params?: TListParams, options: CallOptions = {}): Promise<Paginated<TItem>> {
    return this.http.request<Paginated<TItem>>(this.path, { query: params, signal: options.signal });
  }

  get(id: number, options: CallOptions = {}): Promise<TItem> {
    return this.http.request<TItem>(`${this.path}/${id}`, { signal: options.signal });
  }
}

export class CrudResource<TItem, TListParams extends object, TCreate, TUpdate> extends ReadResource<TItem, TListParams> {
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
