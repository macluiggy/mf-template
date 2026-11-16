/**
 * Permission payload the host stores under `PERMISSION` (user) and
 * `ROLE_PERMISSION` (role). `denny` is the backend's spelling: keep it.
 * Actions are `resource:action` strings; `resource:*` grants or denies every
 * action of that resource.
 */
export interface UserPermission {
  allow: { action: string[] };
  denny: { action: string[] };
  resource: string[];
}
