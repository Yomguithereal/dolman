/**
 * Dolman Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */

/**
 * Is the target a plain object?
 */
function isPlainObject(target) {
  return target &&
         typeof target === 'object' &&
         !Array.isArray(target) &&
         !(target instanceof Date) &&
         !(target instanceof RegExp) &&
         !(target instanceof Map) &&
         !(target instanceof Set);
}

/**
 * Keep only some keys of an object.
 */
function keep(object, keys) {
  var output = {},
      k;

  keys = new Set(keys);

  for (k in object) {
    if (keys.has(k))
      output[k] = object[k];
  }

  return output;
}

/**
 * Unescaping a regex to retrieve the underlying path.
 */
function unescapeRegex(regex) {
  return regex.source
    .replace(/\?\(\?=\\\/\|\$\)/g, '')
    .replace(/^\^\\\//, '/')
    .replace(/\\\//g, '');
}

module.exports = {
  isPlainObject: isPlainObject,
  keep: keep,
  unescapeRegex: unescapeRegex
};
