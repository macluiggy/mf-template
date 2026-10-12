/**
 * Permission resource and actions of this module. The gateway authorizes each
 * request with `x-api-key: <resource>:<action>` (see buildPermissionHeaders).
 */
export enum TemplateAction {
  RESOURCE = 'template',
  LIST = 'listar',
  GET = 'obtener',
  CREATE = 'crear',
  UPDATE = 'actualizar',
}
