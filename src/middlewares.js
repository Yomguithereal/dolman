/**
 * Dolman Middlewares
 * ===================
 *
 * Collection of handy middlewares.
 */

/**
 * Creating a caching middleware.
 */
function cache(store, params) {
  if (typeof params === 'string')
    params = {key: params};

  var key = params.key,
      hasher = typeof params.hasher === 'function' ?
        params.hasher :
        function() { return '$nohash$'; };

  // Initializing the store's key
  store[key] = {};

  return function(req, res, next) {
    var hash = hasher(req);

    // Do we have the data already?
    if (hash in store[key])
      return res.ok(store[key][hash]);

    // Flagging
    res.__shouldBeCached = true;

    // Catching response
    res.on('finish', function() {

      store[key][hash] = res.__sentData;
      delete res.__sentData;
    });

    return next();
  };
}

/**
 * Factory building a validation middleware working for the given definition.
 */
function validate(types, def) {
  return function(req, res, next) {

    var sources = ['params', 'query', 'body'],
        source,
        i,
        l;

    for (i = 0, l = sources.length; i < l; i++) {
      source = sources[i];

      if (def[source] && !types.check(def[source], req[source])) {
        var reason = {
          source: source,
          expecting: def[source],
          sent: req[source] || {}
        };

        if (source === 'params')
          reason.path = req.route.path;

        return res.badRequest(reason);
      }
    }

    return next();
  };
};

module.exports = {
  cache: cache,
  validate: validate
};
