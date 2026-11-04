interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}


export class SdkHttpError extends Error {
  public readonly code: string;

  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    const apiError = (body as ApiErrorBody | undefined)?.error;
    super(apiError?.message ?? `La peticion fallo con estado ${status}`);
    this.name = 'SdkHttpError';
    this.code = apiError?.code ?? 'UNKNOWN_ERROR';
  }
}
