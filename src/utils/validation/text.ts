export type PlainTextValidationResult = {
  isValid: boolean;
  error?: string;
};

const HTML_ANGLE_PATTERN = /[<>]/;

export function validatePlainText(
  value: string | null | undefined,
  fieldLabel: string,
): PlainTextValidationResult {
  if (!value) return { isValid: true };
  if (HTML_ANGLE_PATTERN.test(value)) {
    return {
      isValid: false,
      error: `${fieldLabel} δεν πρέπει να περιέχει HTML.`,
    };
  }
  return { isValid: true };
}

export function validatePlainTextArray(
  values: string[] | null | undefined,
  fieldLabel: string,
): PlainTextValidationResult {
  if (!values || values.length === 0) return { isValid: true };
  const invalid = values.find(item => HTML_ANGLE_PATTERN.test(item));
  if (invalid !== undefined) {
    return {
      isValid: false,
      error: `${fieldLabel} δεν πρέπει να περιέχει HTML.`,
    };
  }
  return { isValid: true };
}
