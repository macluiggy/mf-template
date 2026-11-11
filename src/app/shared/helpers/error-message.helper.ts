import { HttpErrorResponse } from '@angular/common/http';

/** Message shown when the error carries no text the user can understand. */
export const DEFAULT_ERROR_MESSAGE =
  'Ocurrió un error inesperado. Intente nuevamente.';

/**
 * Extracts a user-facing message from an unknown error.
 *
 * The backends answer with the `{ data, message }` envelope, so the message
 * of an `HttpErrorResponse` is the one the user should read. Network failures
 * (status 0) carry no server message and fall back to `fallback`.
 *
 * The result is never empty: an empty fallback falls back to
 * {@link DEFAULT_ERROR_MESSAGE}.
 *
 * @example
 * ```ts
 * this.pubSub.error(toUserMessage(error));
 * ```
 */
export function toUserMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  const safeFallback =
    fallback.trim().length > 0 ? fallback : DEFAULT_ERROR_MESSAGE;

  if (error instanceof HttpErrorResponse) {
    // Status 0 is a network failure: there is no server message to show.
    if (error.status === 0) {
      return safeFallback;
    }
    const envelope = error.error;
    if (typeof envelope === 'object' && envelope !== null) {
      const message = (envelope as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
    if (typeof envelope === 'string' && envelope.trim().length > 0) {
      return envelope;
    }
    return safeFallback;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return safeFallback;
}
