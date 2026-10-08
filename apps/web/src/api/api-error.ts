export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API responded with ${status}`);
    this.name = 'ApiError';
    this.status = status;
  }
}
