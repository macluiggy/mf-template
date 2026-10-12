/**
 * Gateway path prefix of each backend microservice: `${apiUrl}/${prefix}/...`.
 * Add the prefixes your MF calls; keep values identical to the gateway routes.
 */
export enum MsPrefixEnum {
  CORE = 'ms-core',
}
