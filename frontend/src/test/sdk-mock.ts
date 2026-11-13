const pending = () => new Promise(() => {});

export const sdkMock = (resources: Record<string, object>) =>
  new Proxy(resources, {
    get: (target, name: string) => target[name] ?? new Proxy({}, { get: () => pending }),
  });
