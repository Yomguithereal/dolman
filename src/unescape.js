/**
 * Dolman Unescape
 * ================
 *
 * Basic function unescaping a regex to retrieve the underlying path.
 */
module.exports = function(regex) {
  return regex.source
    .replace(/\?\(\?=\\\/\|\$\)/g, '')
    .replace(/^\^\\\//, '/')
    .replace(/\\\//g, '');
};
