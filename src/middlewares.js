/**
 * Dolman Middlewares
 * ===================
 *
 * Collection of handy middlewares.
 */

/**
 * Creating a RAM caching middleware.
 */
function cache(store, params) {
  if (typeof params === 'string')
    params = {key: params};

  var key = params.key,
      hasher = typeof params.hasher === 'function' ?
        params.hasher :
        function() {
          return '$nohash$';
        };

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
 * Leveraging HTTP cache control.
 */
function httpCache(params) {
  var header = null;

  if (typeof params === 'string')
    header = params;

  // If params is an object, use special properties
  // defined by API to set `max-age`.
  if (params !== null && typeof params === 'function' || typeof params === 'object') {
    var durations = {
      seconds: 1, minutes: 60, hours: 3600, days: 86400, weeks: 604800
    };

    Object.keys(durations).some(function(key) {
      if (params.hasOwnProperty(key)) {
        header = 'private, max-age=' + durations[key] * params[key];
        return header;
      }
    });

    if (!header)
      throw new Error('Wrong parameter given for HTTP cache control');
  }

  return function(req, res, next) {
    res.set('Cache-Control', header);
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
          sent: req[source] || {}
        };

        if (source === 'params')
          reason.path = req.route.path;

        return res.badRequest(reason);
      }
    }

    return next();
  };
}

module.exports = {
  cache: cache,
  httpCache: httpCache,
  validate: validate
};
