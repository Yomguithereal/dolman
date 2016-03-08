[![Build Status](https://travis-ci.org/Yomguithereal/dolman.svg)](https://travis-ci.org/Yomguithereal/dolman)

# Dolman

**dolman** is a very light wrapper around an express app meaning to provide some comfortable utilities for one developing a REST API.

As such, dolman overload express' response object to provide handy methods such as `.ok` or `.notFound` and provides a easy way to deploy routers using straightforward configuration.

# Summary

* [Installation](#installation)
* [Usage](#usage)
  * [Wrapping an express app](#wrapping-an-express-app)
  * [Responses](#responses)
  * [Router](#router)
  * [Specs](#specs)
* [What on earth is a dolman?](#explanation)
* [License](#license)

## Installation

You can easily install **dolman** using `npm`:

```bash
npm install --save dolman
```

## Usage

### Wrapping an express app

```js
var express = require('express'),
    wrap = require('dolman');

var app = express();

// Wrapping the express app & providing some options:
var dolman = wrap(app);

// Example with a custom typology:
var dolman = wrap(app, {typology: myCustomTypology});
```

### Responses

A wrapped express app will have an enhanced response object:

```js
var app = express(),
    dolman = wrap(app);

app.get('/hello', function(req, res) {
  return res.ok({hello: 'world'});
});

// The following methods are available:
res.ok([result]);
res.created([result]);
res.badRequest([reason]);
res.unauthorized();
res.forbidden();
res.notFound([reason]);
res.serverError([error]);
```

Note that the responses will be sent as JSON and will follow this standard:

```js
// Typical success
{
  status: 'ok',
  code: 200,
  result: {
    hello: 'world'
  }
}

// Typical error
{
  status: 'error',
  code: 400,
  error: {
    message: 'Bad Request',
    reason: {
      source: 'body',
      expecting: {
        id: 'number'
      },
      sent: {
        id: 'whatever'
      }
    }
  }
}
```

### Router

**dolman** exposes an easy way to create express routers by using lists of configuration objects representing a single route.

```js
var app = express(),
    dolman = wrap(app);

// Creating a router with a single route
var router = dolman.router([
  {
    url: '/hello',
    action: function(req, res) {
      return res.ok({hello: req.query.name});
    }
  }
]);

// Creating the same router with beforehand authentication
var router = dolman.router(authMiddleware, routes);

app.use(router);
// or to use a namespace
app.use('/prefix', router);
```

A route can be described likewise:

```js
{
  // [required] - The matching express pattern.
  // Remember that this could even be an array or a regex.
  url: '/hello/:name',

  // [required] - The action to perform.
  action: function(req, res) {
    return res.ok({hello: req.params.name});
  },

  // You can alternatively pass an array of functions
  action: [fn1, fn2],

  // [optional] - The route's name.
  name: 'hello',

  // [optional] - The route's description.
  description: 'Say hello to someone.',

  // [optional] - The accepted methods.
  // If not provided, defaults to 'ALL'
  method: 'POST',

  // The following also works:
  methods: ['POST', 'PUT'],

  // [optional] - Validation for params, query and body.
  validate: {
    params: {
      name: 'string'
    },
    query: {
      age: '?number'
    },
    body: {
      title: 'string',
      content: {
        id: '?number',
        text: 'string'
      }
    }
  },

  // [optional] - Cache specifications
  cache: 'hello',

  // Or, if the cached response is relative to the request's parameters:
  cache: {
    key: 'hello',
    hasher: function(req) {
      return req.params.name;
    }
  },

  // [optional] You can leverage HTTP Cache-Control headers as well.
  httpCache: 'no-cache, no-store, must-revalidate',

  // Or, shorthand and fluent way to set 'private, max-age':
  httpCache: {
    hours: 2 // seconds, minutes, hours, days, weeks
  },

  // [optional] - A typology definition used to valid and clamp the data output.
  mask: {
    name: 'string',
    age: '?number'
  }
}
```

Note that the validation specifications are handled by the [typology](https://github.com/jacomyal/typology) library.

## Specs

**dolman** gives you the opportunity to retrieve very easily the specifications of your API if you need them, for instance, to hydrate a client elsewhere.

The output will follow the [SPORE](https://github.com/SPORE/specifications) specifications.

```js
var express = require('express'),
    wrap = require('dolman');

var app = express(),
    dolman = wrap(express);

var router = dolman.router([
  {
    url: '/hello',
    name: 'hello',
    description: 'Say hello.',
    action: function(req, res) {
      return res.ok({hello: 'world'});
    }
  }
]);

app.use('/nested', router);

dolman.specs();
>>> {
  formats: ['json'],
  methods: {
    hello: {
      path: '/nested/hello',
      name: 'hello',
      description: 'Say hello.'
    }
  }
}
```

Note that **dolman** will only output your routes having a name.

<h2 id="explanation">What on earth is a dolman?</h2>

A [dolman](https://en.wikipedia.org/wiki/Dolman) is a loose garment with narrow sleeves, an opening in the front and lavish braids. While originating from Turkey, this garment was mostly worn as a jacket by hussars.

## License

[MIT](LICENSE.txt)
