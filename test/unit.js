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
    sinon = require('sinon'),
    async = require('async'),
    wrap = require('../index.js');

var customTypes = new Typology({
  custom: function(v) {
    return v === 'custom';
  }
});

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
    var app = express();

    wrap(app);

    RESPONSES.forEach(function(response) {
      assert(typeof app.response[response.method] === 'function');
    });
  });

  it('an app should return the correct codes.', function(done) {
    var app = express();

    wrap(app);

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
  var dolman,
      app;

  beforeEach(function() {
    app = express();
    dolman = wrap(app, {typology: customTypes});
  });

  describe('Basics', function() {
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

    it('passing multiple actions should work.', function(done) {
      var router = dolman.router([
        {
          url: '/hello',
          action: [
            function(req, res, next) {
              req.message = {hello: 'world'};
              return next();
            },
            function(req, res) {
              return res.json(req.message);
            }
          ]
        }
      ]);

      app.use(router);

      request(app)
        .get('/hello')
        .expect(200, {hello: 'world'}, done);
    });

    it('should be possible to pass series of middlewares before the routes.', function(done) {
      var authName = function(req, res, next) {
        if (req.query.name === 'John')
          return next();
        return res.forbidden();
      };

      var authSurname = function(req, res, next) {
        if (req.query.surname === 'Black')
          return next();
        return res.notFound();
      };

      var router = dolman.router(authName, authSurname, [
        {
          url: '/hello',
          action: function(req, res) {
            return res.json({hello: 'world'});
          }
        }
      ]);

      app.use(router);

      async.series({
        rejectedName: function(next) {
          request(app)
            .get('/hello')
            .expect(403, next);
        },
        rejectedSurname: function(next) {
          request(app)
            .get('/hello?name=John')
            .expect(404, next);
        },
        accepted: function(next) {
          request(app)
            .get('/hello?name=John&surname=Black')
            .expect(200, {hello: 'world'}, next);
        }
      }, done);
    });
  });

  describe('Validation', function() {
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
  });

  describe('Cache', function() {
    it('RAM cache middleware should work.', function(done) {
      var one = 0,
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
  });

  describe('Masks', function() {

    it('masks should clamp sent data.', function(done) {
      var router = dolman.router([
        {
          url: '/masked',
          mask: {
            one: 'number',
            two: 'number'
          },
          action: function(req, res) {
            return res.ok({
              one: 1,
              two: 2,
              three: 3
            });
          }
        }
      ]);

      app.use(router);

      request(app)
        .get('/masked')
        .expect(200, {
          status: 'ok',
          code: 200,
          result: {
            one: 1,
            two: 2
          }
        }, done);
    });

    it('masks should also clamp collections.', function(done) {
      var router = dolman.router([
        {
          url: '/masked',
          mask: [{name: 'string', age: 'number'}],
          action: function(req, res) {
            return res.ok([
              {
                name: 'John',
                surname: 'White',
                age: 45
              },
              {
                name: 'Jack',
                surname: 'Black',
                age: 56
              }
            ]);
          }
        }
      ]);

      app.use(router);

      request(app)
        .get('/masked')
        .expect(200, {
          status: 'ok',
          code: 200,
          result: [
            {
              name: 'John',
              age: 45
            },
            {
              name: 'Jack',
              age: 56
            }
          ]
        }, done);
    });

    it('masks should warn the user when sent data is not valid.', function(done) {
      var spy = sinon.spy(),
          logger = {warn: spy, error: spy};

      app = express();
      dolman = wrap(app, {logger: logger});

      var router = dolman.router([
        {
          url: '/primitive',
          mask: 'number',
          action: function(req, res) {
            return res.ok('hello');
          }
        }
      ]);

      app.use(router);

      request(app)
        .get('/primitive')
        .expect(200, function() {
          assert(spy.called);
          done();
        });
    });
  });
});

/**
 * Specifications.
 */
describe('Specifications', function() {

  it('should be possible to retrieve our app\'s specifications.', function() {
    var app = express(),
        dolman = wrap(app);

    var router1 = dolman.router([
      {
        url: '/hello',
        name: 'hello',
        description: 'Say hello.',
        action: function(req, res) {
          return res.ok({hello: 'world'});
        }
      },
      {
        url: '/greet/:name',
        name: 'greet',
        method: 'POST',
        action: function(req, res) {
          return res.ok({hello: req.params.name});
        }
      }
    ]);

    var router2 = dolman.router([
      {
        url: '/goodbye',
        name: 'goodbye',
        methods: ['PUT', 'POST'],
        description: 'Good Bye.',
        action: function(req, res) {
          return res.ok({goodbye: 'world'});
        }
      }
    ]);

    app.use(router1);
    app.use('/nested', router2);

    var specs = dolman.specs();

    assert.deepEqual(specs, {
      formats: ['json'],
      methods: {
        hello: {
          path: '/hello',
          name: 'hello',
          description: 'Say hello.',
          method: 'GET'
        },
        greet: {
          path: '/greet/:name',
          name: 'greet',
          method: 'POST'
        },
        goodbye: {
          path: '/nested/goodbye',
          name: 'goodbye',
          description: 'Good Bye.',
          method: 'PUT'
        }
      }
    });
  });
});
