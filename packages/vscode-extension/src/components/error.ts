export default class AlovaError extends Error {
  ERROR_CODE = 'error';

  force = false;

  constructor(message?: string, force: boolean = false) {
    super(message);
    this.name = 'AlovaError';
    this.force = force;
  }
}
export const AlovaErrorConstructor = AlovaError as unknown as ErrorConstructor;
