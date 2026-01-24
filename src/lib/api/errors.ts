export const API_ERRORS = {
  UNAUTHORIZED: { error: 'Μη εξουσιοδοτημένη πρόσβαση', status: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { error: 'Απαγορεύεται η πρόσβαση', status: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { error: 'Δεν βρέθηκε', status: 404, code: 'NOT_FOUND' },
  BAD_REQUEST: { error: 'Μη έγκυρο αίτημα', status: 400, code: 'BAD_REQUEST' },
  INTERNAL: { error: 'Εσωτερικό σφάλμα διακομιστή', status: 500, code: 'INTERNAL' },
} as const;
