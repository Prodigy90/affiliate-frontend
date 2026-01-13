/**
 * Extract a user-friendly error message from an unknown error.
 * Useful for displaying errors in toast notifications.
 *
 * @param error - The error object (can be Error, string, or unknown)
 * @param fallback - Fallback message if error cannot be parsed
 * @returns A string message suitable for display
 */
export function getErrorMessage(error: unknown, fallback: string = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}

/**
 * Type guard to check if a value is an Error object.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
