/**
 * Dolman Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */
var assign = require('object-assign');

/**
 * Retrieve a request's series of parameters from composite sources.
 */
function params(req) {
  return assign({}, req.params, req.query, req.body);
}

/**
 * Exporting.
 */
module.exports = {
  params: params
};
