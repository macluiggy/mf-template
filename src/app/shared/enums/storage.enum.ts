/**
 * localStorage key names used by StorageService. encrypt-storage hashes the
 * key name with SECRET_KEY, so renaming a key makes existing values unreadable.
 */
export enum StorageEnum {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  USER_SESSION = 'USER_SESSION',
}
