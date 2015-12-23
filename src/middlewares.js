/**
 * Dolman Middlewares
 * ===================
 *
 * Collection of handy middlewares.
 */

/**
 * Factory building a validation middleware working for the given definition.
 */
function validate(types, def) {
  return function(req, res, next) {

    var sources = ['params', 'query', 'body'],
        source,
        i,
        l;

    for (var i = 0, l = sources; i < l; i++) {
      source = sources[i];

      if (def[source] && !types.check(def[source], req[source]))
        return res.badRequest({
          source: source,
          expecting: def[source]
        });
    }

    return next();
  };
};
