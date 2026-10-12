import { HttpHeaders } from '@angular/common/http';

/**
 * Headers the gateway uses to authorize a request: `x-api-key` carries the
 * `resource:action` pair checked against the user's permissions.
 *
 * @example this.http.get(url, { headers: buildPermissionHeaders('user', 'listar') })
 */
export function buildPermissionHeaders(resource: string, action: string): HttpHeaders {
  return new HttpHeaders({
    'Content-Type': 'application/json',
    'x-api-key': `${resource}:${action}`,
  });
}
