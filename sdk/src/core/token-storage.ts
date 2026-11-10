export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenStorage {
  get(): AuthTokens | null;
  set(tokens: AuthTokens | null): void;
}

export const memoryStorage = (): TokenStorage => {
  let tokens: AuthTokens | null = null;
  return {
    get: () => tokens,
    set: (value) => {
      tokens = value;
    },
  };
};
