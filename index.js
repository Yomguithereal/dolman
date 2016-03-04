/**
 * Dolman API Endpoint
 * ====================
 *
 * Exposing the library's utilities.
 */
var responses = require('./src/responses.js'),
    createLogger = require('./src/createLogger.js'),
    middlewares = require('./src/middlewares.js'),
    helpers = require('./src/helpers.js'),
    express = require('express'),
    Typology = require('typology'),
    join = require('path').join,
    util = require('util');

module.exports = function(app, opts) {
  opts = opts || {};

  // Creating the logger
  var logger = opts.logger;

  if (!logger)
    logger = createLogger('logger' in opts && !opts.logger);

  // Building internal typology
  var types;

  if (opts.typology instanceof Typology)
    types = opts.typology;
  else
    types = new Typology(opts.typology || {});

  // Applying responses to the express app
  responses(app, logger, types);

  // Internal route register
  var routesMap = new Map();

  // Internal RAM cache
  var cache = {};

  /**
   * Router function.
   */
  function makeRouter() {

    // Solving arguments
    var args = [].slice.call(arguments);

    var beforeMiddlewares = args.slice(0, -1),
        routes = args[args.length - 1];

    var router = express.Router();

    routes.forEach(function(route) {
      if (!route.url)
        throw Error('dolman.router: one route has no url: ' + util.inspect(route));

      if (!route.action)
        throw Error('dolman.router: the route for url ' + route.url + ' has no action.');

      var actions = [].concat(route.action);

      // Storing the route
      routesMap.set(actions[0], route);

      // Applying before middlewares
      var routeMiddlewares = beforeMiddlewares.slice();

      // Validation
      if (route.validate)
        routeMiddlewares.push(middlewares.validate(types, route.validate));

      // Mask
      if (route.mask)
        routeMiddlewares.push(middlewares.mask(route.mask));

      // RAM cache
      if (route.cache)
        routeMiddlewares.push(middlewares.cache(cache, route.cache));

      // HTTP cache
      if (route.httpCache)
        routeMiddlewares.push(middlewares.httpCache(route.httpCache));

      // Determining the method
      var methods = [].concat(route.method || route.methods || 'ALL');

      methods.forEach(function(method) {
        router[method.toLowerCase()].apply(
          router,
          [route.url]
            .concat(routeMiddlewares)
            .concat(actions)
        );
      });
    });

    return router;
  }

  /**
   * Specifications functions.
   */
  function specs() {
    var routes = {};

    // Reducing the app's recursive stack
    function reduceStack(path, items, item) {
      var nextPath;

      if (item.handle && item.handle.stack) {
        nextPath = join(path, (item.path || helpers.unescapeRegex(item.regexp) || ''));
        return items.concat(item.handle.stack.reduce(reduceStack.bind(null, nextPath), []));
      }

      if (item.route) {
        nextPath = join(path, (item.route.path || ''));
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
        var route = item.route,
            method = [].concat(route.method || route.methods)[0];

        var routeData = {
          path: item.path,
          name: route.name,
          method: !method || method === 'ALL' ? 'GET' : method
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
