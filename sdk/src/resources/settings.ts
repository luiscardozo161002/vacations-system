import { ApiResource, CallOptions } from '../core/api-resource';
import type { HttpClient } from '../core/http-client';

export interface UserSettings {
  theme: 'light' | 'dark' | null;
  backdrop_light: string | null;
  backdrop_dark: string | null;
  button_color: string | null;
  window_alpha: number | null;
}

export type SaveUserSettingsInput = Partial<UserSettings>;

export class SettingsResource extends ApiResource {
  constructor(http: HttpClient) {
    super(http, '/me/settings');
  }

  get(options: CallOptions = {}): Promise<UserSettings> {
    return this.http.request<UserSettings>(this.path, { signal: options.signal });
  }

  save(input: SaveUserSettingsInput): Promise<UserSettings> {
    return this.http.request<UserSettings>(this.path, { method: 'PUT', body: input });
  }
}
