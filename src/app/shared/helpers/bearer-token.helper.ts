/**
 * True when a value is safe to send as an Authorization Bearer token.
 * Rejects missing values and the JS stringifications "undefined" / "null".
 */
export function isUsableBearerToken(token: unknown): token is string {
  if (typeof token !== 'string') {
    return false;
  }
  const normalized = token.trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'undefined' && normalized !== 'null';
}
