export const API_ERRORS = {
  UNAUTHORIZED: { error: 'Unauthorized access', status: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { error: 'Access forbidden', status: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { error: 'Not found', status: 404, code: 'NOT_FOUND' },
  BAD_REQUEST: { error: 'Invalid request', status: 400, code: 'BAD_REQUEST' },
  INTERNAL: { error: 'Internal server error', status: 500, code: 'INTERNAL' },
} as const;
