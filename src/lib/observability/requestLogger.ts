import { logApplicationEvent, type ApplicationLogLevel } from './applicationLogger';

type LogPayload = {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly durationMs: number;
  readonly error?: boolean;
};

export function logApiRequest(payload: LogPayload) {
  const formattedStatus = payload.status ?? 500;
  const verb = payload.error ? 'ERROR' : 'INFO';
  console.info(
    `[API] ${verb} ${payload.method} ${payload.path} ${formattedStatus} ${payload.durationMs}ms`,
  );

  const level: ApplicationLogLevel =
    payload.error || formattedStatus >= 500 ? 'error' : formattedStatus >= 400 ? 'warn' : 'info';

  void logApplicationEvent({
    level,
    source: 'api',
    message: `${payload.method} ${payload.path}`,
    path: payload.path,
    method: payload.method,
    status: formattedStatus,
    durationMs: payload.durationMs,
    details: payload.error ? { error: true } : null,
  });
}
