/**
 * Dolman Middlewares
 * ===================
 *
 * Collection of handy middlewares.
 */
var helpers = require('./helpers.js');

/**
 * Factory building a validation middleware working for the given definition.
 */
function validate(types, def) {
  return function(req, res, next) {
    var payload = helpers.params(req);

    if (types.check(def, payload))
      return res.badRequest(def);

    return next();
  };
};
