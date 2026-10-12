/**
 * Lightweight environment variable helper
 * Replaces env-var dependency with minimal footprint
 * Only includes methods required by load-env.js
 *
 * Usage: env.get('VAR_NAME').default('value').asString()
 */

/**
 * Validates if a URL is valid
 * @param {string} url URL to validate
 * @returns {boolean} true if valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates an environment variable validator/parser
 * @param {string} varName Variable name
 * @returns {object} Validator object with chainable methods
 */
function createEnvVar(varName) {
  const value = process.env[varName];

  return {
    /**
     * Set default value if variable is not defined
     * @param {string} defaultValue Default value
     * @returns {object} Chainable validator
     */
    default(defaultValue) {
      this._value = value !== undefined ? value : defaultValue;
      return this;
    },

    /**
     * Mark variable as required (throw error if undefined)
     * @returns {object} Chainable validator
     */
    required() {
      if (value === undefined || value === '') {
        throw new Error(`Required environment variable '${varName}' is not defined`);
      }
      this._value = value;
      return this;
    },

    /**
     * Parse as string
     * @returns {string} Parsed value
     */
    asString() {
      const finalValue = this._value !== undefined ? this._value : value;
      if (finalValue === undefined || finalValue === '') {
        throw new Error(`Environment variable '${varName}' is not defined`);
      }
      return String(finalValue);
    },

    /**
     * Parse as URL string with validation
     * @returns {string} Validated URL
     */
    asUrlString() {
      const finalValue = this._value !== undefined ? this._value : value;
      if (finalValue === undefined || finalValue === '') {
        throw new Error(`Environment variable '${varName}' is not defined`);
      }
      const urlString = String(finalValue);
      if (!isValidUrl(urlString)) {
        throw new Error(`Environment variable '${varName}' is not a valid URL: ${urlString}`);
      }
      return urlString;
    },

    /**
     * Parse as enum (validate against allowed values)
     * @param {string[]} allowedValues Allowed values
     * @returns {string} Validated enum value
     */
    asEnum(allowedValues) {
      const finalValue = this._value !== undefined ? this._value : value;
      if (finalValue === undefined || finalValue === '') {
        throw new Error(`Environment variable '${varName}' is not defined`);
      }
      const strValue = String(finalValue);
      if (!allowedValues.includes(strValue)) {
        throw new Error(
          `Environment variable '${varName}' must be one of [${allowedValues.join(
            ', ',
          )}], got: ${strValue}`,
        );
      }
      return strValue;
    },

    /**
     * Get the current value (for chaining without final conversion)
     * @returns {*} Current value
     */
    _getValue() {
      return this._value !== undefined ? this._value : value;
    },
  };
}

/**
 * Main env object with get() method (compatible with env-var API)
 */
const env = {
  /**
   * Get an environment variable validator/parser
   * @param {string} varName Variable name
   * @returns {object} Validator object
   */
  get(varName) {
    return createEnvVar(varName);
  },
};

module.exports = env;
