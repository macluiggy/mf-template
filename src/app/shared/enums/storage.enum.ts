/**
 * localStorage key names shared with the host (frontcontainer STORAGE_KEYS)
 * and frontcore. They MUST stay byte-identical: encrypt-storage hashes the key
 * name with SECRET_KEY, so a different spelling reads nothing.
 */
export enum StorageEnum {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  USER_SESSION = 'USER_SESSION',
  TYPE_ID = 'TYPE_ID',
  PERMISSION = 'PERMISSION',
  ROLE_PERMISSION = 'ROLE_PERMISSION',
  ROLE_ID = 'ROLE',
  NAVIGATION = 'NAVIGATION',
  BROKER = 'BROKER',
  CHANNEL = 'CHANNEL',
  METADATA = 'METADATA',
  OV_LEGACY_CREDENTIAL = 'param_ov_antigua',
}
