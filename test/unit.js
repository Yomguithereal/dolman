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

  it('RAM cache middleware should work.', function(done) {
    var app = express(),
        one = 0,
        two = 0;

    var router = dolman.router([
      {
        url: '/one',
        cache: 'one',
        action: function(req, res) {
          one++;
          return res.ok({hello: 'world'});
        }
      },
      {
        url: '/two',
        cache: {
          key: 'two',
          hasher: function(req) {
            return req.query.title;
          }
        },
        action: function(req, res) {
          two++;
          return res.ok({title: req.query.title});
        }
      }
    ]);

    app.use(router);

    async.series({
      one: function(next) {
        request(app)
          .get('/one')
          .expect(200, {
            code: 200,
            status: 'ok',
            result: {
              hello: 'world'
            }
          }, next);
      },
      oneCached: function(next) {
        request(app)
          .get('/one')
          .expect(200, {
            code: 200,
            status: 'ok',
            result: {
              hello: 'world'
            }
          }, next);
      },
      two: function(next) {
        request(app)
          .get('/two?title=world')
          .expect(200, {
            code: 200,
            status: 'ok',
            result: {
              title: 'world'
            }
          }, next);
      },
      twoCached: function(next) {
        request(app)
          .get('/two?title=world')
          .expect(200, {
            code: 200,
            status: 'ok',
            result: {
              title: 'world'
            }
          }, next);
      },
      count: function(next) {
        assert(one === 1);
        assert(two === 1);
        return next();
      }
    }, done);
  });

  it('HTTP cache middleware should work.', function(done) {
    var app = express();

    var val1 = 'public, max-age=3600',
        val2 = 'private, max-age=59', // 59 seconds
        val3 = 'private, max-age=60', // 1 minute
        val4 = 'private, max-age=7200', // 2 hours
        val5 = 'private, max-age=259200', // 3 days
        val6 = 'private, max-age=2419200'; // 4 weeks

    var action = function(req, res) {
      return res.ok();
    };

    var router = dolman.router([
      {
        url: '/string',
        httpCache: val1,
        action: action
      },
      {
        url: '/seconds',
        httpCache: {seconds: 59},
        action: action
      },
      {
        url: '/minutes',
        httpCache: {minutes: 1},
        action: action
      },
      {
        url: '/hours',
        httpCache: {hours: 2},
        action: action
      },
      {
        url: '/days',
        httpCache: {days: 3},
        action: action
      },
      {
        url: '/weeks',
        httpCache: {weeks: 4},
        action: action
      }
    ]);

    app.use(router);

    async.series({
      stringParam: function(next) {
        request(app)
          .get('/string')
          .expect('Cache-Control', val1, next);
      },
      seconds: function(next) {
        request(app)
          .get('/seconds')
          .expect('Cache-Control', val2, next);
      },
      minutes: function(next) {
        request(app)
          .get('/minutes')
          .expect('Cache-Control', val3, next);
      },
      hours: function(next) {
        request(app)
          .get('/hours')
          .expect('Cache-Control', val4, next);
      },
      days: function(next) {
        request(app)
          .get('/days')
          .expect('Cache-Control', val5, next);
      },
      weeks: function(next) {
        request(app)
          .get('/weeks')
          .expect('Cache-Control', val6, next);
      }
    }, done);
  });

  it('HTTP cache middle should throw an error on unexpected params.', function(done) {
    var app = express();
    var router;

    function setup() {
      router = dolman.router([
        {
          url: '/foo',
          httpCache: {no: 'way'},
          action: function(req, res) {
            return res.ok();
          }
        }
      ]);
      app.use(router);
    }

    assert.throws(setup, Error);
    request(app).get('/foo').end(done);
  });

  // it('before middleware should work.', function() {

  // });

  // it('before middleware on a single route should work.', function() {

  // });
});
