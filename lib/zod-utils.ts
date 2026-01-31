import { ZodError } from "zod";

/**
 * Flattens a ZodError and returns the first error message found.
 * Suitable for returning to a client that expects a simple string error.
 */
export function getFirstZodErrorMessage(error: ZodError): string {
  const flattened = error.flatten();
  const firstFormError = flattened.formErrors[0];
  if (firstFormError) return firstFormError;

  const firstFieldError = Object.values(flattened.fieldErrors).flat()[0];
  if (firstFieldError) return firstFieldError;

  return "Invalid request data.";
}
