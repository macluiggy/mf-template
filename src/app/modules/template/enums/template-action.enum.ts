/**
 * Permission resource and actions of this module. Pass them to the
 * `PermissionChecker` port or to `permissionGuard(resource, action)`.
 * The host integration maps them to its own payload.
 */
export enum TemplateAction {
  RESOURCE = 'template',
  LIST = 'listar',
  GET = 'obtener',
  CREATE = 'crear',
  UPDATE = 'actualizar',
}
