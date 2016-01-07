/**
 * Dolman API Endpoint
 * ====================
 *
 * Exposing the library's utilities.
 */
var responses = require('./src/responses.js'),
    middlewares = require('./src/middlewares.js'),
    unescapeRegex = require('./src/unescape.js'),
    HashMap = require('./src/hashmap.js'),
    Typology = require('typology'),
    join = require('path').join,
    util = require('util');

module.exports = function(express, opts) {
  opts = opts || {};

  // Applying responses to express
  responses(express);

  // Building internal typology
  var types;

  if (opts.typology instanceof Typology)
    types = opts.typology;
  else
    types = new Typology(opts.typology || {});

  // Internal route register
  var routesMap = new HashMap();

  // Internal RAM cache
  var cache = {};

  /**
   * Router function.
   */
  function makeRouter(routes, o) {
    o = o || {};

    var router = express.Router(),
        after = [].concat(o.after || []);

    routes.forEach(function(route) {
      if (!route.url)
        throw Error('dolman.router: one route has no url: ' + util.inspect(route));

      if (!route.action)
        throw Error('dolman.router: the route for url ' + route.url + ' has no action.');

      // Storing the route
      routesMap.set(route.action, route);

      // Applying before middlewares
      var routeMiddlewares = [];

      // Validation
      if (route.validate)
        routeMiddlewares.push(middlewares.validate(types, route.validate));

      // RAM cache
      if (route.cache)
        routeMiddlewares.push(middlewares.cache(cache, route.cache));

      // HTTP cache
      if (route.httpCache)
        routeMiddlewares.push(middlewares.httpCache(route.httpCache));

      // Applying after middlewares
      routeMiddlewares = routeMiddlewares.concat(after);

      // Determining the method
      var methods = [].concat(route.method || route.methods || 'ALL');

      methods.forEach(function(method) {
        router[method.toLowerCase()].apply(
          router,
          [route.url]
            .concat(routeMiddlewares)
            .concat(route.action)
        );
      });
    });

    return router;
  }

  /**
   * Specifications functions.
   */
  function specs(app) {
    var routes = {};

    // Reducing the app's recursive stack
    function reduceStack(path, items, item) {
      var subStack = [];

      if (item.handle && item.handle.stack) {
        var nextPath = join(path, (item.path || unescapeRegex(item.regexp) || ''));
        return items.concat(item.handle.stack.reduce(reduceStack.bind(null, nextPath), []));
      }

      if (item.route) {
        var nextPath = join(path, (item.route.path || ''));
        return items.concat(item.route.stack.reduce(reduceStack.bind(null, nextPath), []));
      }

      return items.concat({
        handle: item.handle,
        path: path
      });
    }

    // Filtering the actions coming from dolman
    app._router.stack
      .reduce(reduceStack.bind(null, ''), [])
      .map(function(item) {
        return {
          route: routesMap.get(item.handle),
          path: item.path
        };
      })
      .filter(function(item) {
        return item.route && item.route.name;
      })
      .forEach(function(item) {
        var route = item.route;

        var routeData = {
          path: item.path,
          name: route.name
        };

        ['description'].forEach(function(k) {
          if (route[k])
            routeData[k] = route[k];
        });

        routes[route.name] = routeData;
      });

    return {
      formats: ['json'],
      methods: routes
    };
  }

  // Returning an object to handle
  return {
    router: makeRouter,
    specs: specs
  };
};
