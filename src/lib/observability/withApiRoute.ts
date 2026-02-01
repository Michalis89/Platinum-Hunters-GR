import * as Sentry from '@sentry/nextjs';
import { logApiRequest } from '@/lib/observability/requestLogger';

export function withApiRoute<Ctx extends unknown[]>(
  handler: (request: Request, ...context: Ctx) => Promise<Response>,
): (request: Request, ...context: Ctx) => Promise<Response> {
  return async function (request: Request, ...context: Ctx) {
    const start = Date.now();
    try {
      const response = await handler(request, ...context);
      const duration = Date.now() - start;
      logApiRequest({
        method: request.method,
        path: new URL(request.url).pathname,
        status: response?.status ?? 200,
        durationMs: duration,
      });
      return response;
    } catch (error) {
      Sentry.captureException(error);
      const duration = Date.now() - start;
      logApiRequest({
        method: request.method,
        path: new URL(request.url).pathname,
        status: 500,
        durationMs: duration,
        error: true,
      });
      throw error;
    }
  };
}
