export default class AlovaError extends Error {
  ERROR_CODE = 'error';

  constructor(message?: string) {
    super(message);
    this.name = 'AlovaError';
  }
}
export const AlovaErrorConstructor = AlovaError as unknown as ErrorConstructor;
