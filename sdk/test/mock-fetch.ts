export interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

type Handler = (call: FetchCall) => Response | Promise<Response>;

export const json = (status: number, body?: unknown): Response =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const mockFetch = (handler: Handler) => {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;

  globalThis.fetch = async (input, init = {}) => {
    const call: FetchCall = {
      url: String(input),
      method: init.method ?? 'GET',
      headers: (init.headers ?? {}) as Record<string, string>,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    return handler(call);
  };

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
};
