/**
 * Dolman Unit Tests
 * ==================
 *
 * The library's unit tests.
 */
var Typology = require('typology'),
    express = require('express'),
    request = require('supertest'),
    assert = require('assert'),
    async = require('async');

var customTypes = new Typology({
  custom: function(v) {
    return v === 'custom';
  }
});

var dolman = require('../index.js')(express, {typology: customTypes});

/**
 * Helpers.
 */
function makeApp(controller) {
  var app = express(),
      router = dolman.router(controller);

  app.use('/dolman', router);

  return app;
}

/**
 * Responses.
 */
describe('Responses', function() {
  var RESPONSES = [
    {method: 'ok', code: 200},
    {method: 'created', code: 201},
    {method: 'notModified', code: 304},
    {method: 'badRequest', code: 400},
    {method: 'serverError', code: 500},
    {method: 'notFound', code: 404},
    {method: 'unauthorized', code: 401},
    {method: 'forbidden', code: 403}
  ];

  it('express\'s responses should have been enhanced.', function() {
    RESPONSES.forEach(function(response) {
      assert(typeof express.response[response.method] === 'function');
    });
  });

  it('an app should return the correct codes.', function(done) {
    var app = express();

    RESPONSES.forEach(function(response) {

      app.get('/' + response.method, function(req, res) {
        return res[response.method]();
      });
    });

    async.eachSeries(RESPONSES, function(response, next) {

      request(app)
        .get('/' + response.method)
        .expect(response.code, next);
    }, done);
  });
});

/**
 * Router.
 */
describe('Router', function() {

  it('validation middleware should work.', function() {

  });
  // API
  // WORKING
});
