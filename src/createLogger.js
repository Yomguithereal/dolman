/* eslint no-console: 0 */
/**
 * Dolman Logger Factory
 * ======================
 *
 * Very simple function returning a logger for debugging purposes.
 */
module.exports = function createLogger(noop) {
  if (noop)
    return {
      error: Function.prototype,
      warn: Function.prototype
    };

  return {
    error: console.error.bind(console),
    warn: console.warn.bind(console)
  };
};
