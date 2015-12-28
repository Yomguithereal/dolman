/**
 * Dolman Unit Tests
 * ==================
 *
 * The library's unit tests.
 */
var Typology = require('typology'),
    express = require('express'),
    bodyParser = require('body-parser'),
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
    {method: 'unauthorized', code: 401},
    {method: 'forbidden', code: 403},
    {method: 'notFound', code: 404},
    {method: 'serverError', code: 500}
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

  it('a route without url should throw.', function() {
    assert.throws(function() {
      dolman.router([
        {
          action: function(req, res) {
            return res.send('hello');
          }
        }
      ]);
    }, /no url/);
  });

  it('a route without action should throw.', function() {
    assert.throws(function() {
      dolman.router([
        {
          url: '/hello'
        }
      ]);
    }, /no action/);
  });

  it('basic routes should work.', function(done) {
    var app = express();

    var router = dolman.router([
      {
        url: '/test',
        action: function(req, res) {
          return res.ok();
        }
      }
    ]);

    app.use(router);

    request(app)
      .get('/test')
      .expect('Content-Type', /json/)
      .expect(200, {
        code: 200,
        status: 'ok'
      }, done);
  });

  it('method(s) should work.', function(done) {
    var app = express();

    var action = function(req, res) {
      return res.ok();
    };

    var router = dolman.router([
      {
        url: '/post',
        method: 'POST',
        action: action
      },
      {
        url: '/lowercase',
        method: 'post',
        action: action
      },
      {
        url: '/put',
        methods: ['POST', 'PUT'],
        action: action
      }
    ]);

    app.use(router);

    async.series({
      notFound: function(next) {
        request(app)
          .get('/post')
          .expect(404, next);
      },
      post: function(next) {
        request(app)
          .post('/post')
          .expect(200, next);
      },
      lowercase: function(next) {
        request(app)
          .post('/lowercase')
          .expect(200, next);
      },
      put: function(next) {
        request(app)
          .put('/put')
          .expect(200, next);
      }
    }, done);
  });

  it('validation middleware should work.', function(done) {

    var controller = [
      {
        url: '/url/:id',
        validate: {
          params: {
            id: 'custom'
          },
          query: {
            title: 'string'
          }
        },
        method: 'GET',
        action: function(req, res) {
          return res.ok();
        }
      },
      {
        url: '/url/:id',
        validate: {
          params: {
            id: 'custom'
          },
          body: {
            text: 'string',
            number: '?number'
          }
        },
        method: 'POST',
        action: function(req, res) {
          return res.ok({hello: req.body.text});
        }
      }
    ];

    var app = express();

    app.use(bodyParser.json());

    app.use(dolman.router(controller));

    async.series({
      invalidParams: function(next) {
        request(app)
          .get('/url/shawarma')
          .expect(400, {
            code: 400,
            status: 'error',
            error: {
              message: 'Bad Request',
              reason: {
                source: 'params',
                path: '/url/:id',
                expecting: {
                  id: 'custom'
                },
                sent: {
                  id: 'shawarma'
                }
              }
            }
          }, next);
      },
      invalidQuery: function(next) {
        request(app)
          .get('/url/custom')
          .expect(400, {
            code: 400,
            status: 'error',
            error: {
              message: 'Bad Request',
              reason: {
                source: 'query',
                expecting: {
                  title: 'string'
                },
                sent: {}
              }
            }
          }, next);
      },
      invalidBody: function(next) {
        request(app)
          .post('/url/custom')
          .send({number: 42})
          .expect(400, {
            code: 400,
            status: 'error',
            error: {
              message: 'Bad Request',
              reason: {
                source: 'body',
                expecting: {
                  text: 'string',
                  number: '?number'
                },
                sent: {
                  number: 42
                }
              }
            }
          }, next);
      },
      valid: function(next) {
        request(app)
          .post('/url/custom')
          .send({text: 'world'})
          .expect(200, {
            code: 200,
            status: 'ok',
            result: {
              hello: 'world'
            }
          }, next);
      }
    }, done);
  });

  it('cache middleware should work.', function() {

  });

  it('before middleware should work.', function() {

  });

  it('before middleware on a single route should work.', function() {

  });
});
