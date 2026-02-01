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
}
