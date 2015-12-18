/**
 * Dolman API Endpoint
 * ====================
 *
 * Exposing the library's utilities.
 */
var responses = require('./src/responses.js'),
    middlewares = require('./src/middlewares.js'),
    Typology = require('typology'),
    util = require('util');

module.exports = function(express, opts) {
  opts = opts || {};

  // Building internal typology
  var types;

  if (opts.typology instanceof Typology)
    types = opts.typology;
  else
    types = new Typology(opts.typology || {});

  // Applying responses to express
  responses(express);

  // Building the router function
  function makeRouter(routes, o) {
    o = o || {};

    var router = express.Router(),
        before = [].concat(o.before || []),
        after = [].concat(o.after || []);

    routes.forEach(function(route) {
      if (!route.url)
        throw Error('dolman.router: one route has no url: ' + util.inspect(route));

      if (!route.action)
        throw Error('dolman.router: the route for url ' + route.url + ' has no action.');

      // Applying before middlewares
      var routeMiddlewares = before;

      // Validation
      if (route.validate)
        routeMiddlewares.push(middlewares.validate(types, route.validate));

      // Applying after middlewares
      routeMiddlewares = routeMiddlewares.concat(after);

      // Determining the method
      var methods = [].concat(route.method || route.methods || 'GET');

      methods.forEach(function(method) {
        router[method.toLowerCase()].apply(
          router,
          [route.url].concat(routeMiddlewares).concat(route.action)
        );
      });
    });

    return router;
  };

  // Returning an object to handle
  return {
    router: makeRouter
  };
};
