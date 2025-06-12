import { logger } from '@/infrastructure/logger';
import { ErrorCode } from './ErrorCode';

export class WormholeError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'WormholeError';
  }

  static handle(error: unknown): void {
    if (error instanceof WormholeError) {
      logger.error(`[${error.code}] ${error.message}`, error.details);
    } else {
      logger.error('Unexpected error', error);
    }
  }
}
export default WormholeError;
