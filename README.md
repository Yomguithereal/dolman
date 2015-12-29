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
* [What on earth is a dolman?](#explanation)
* [Roadmap](#roadmap)
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
    dolman = require('dolman')(express, options);

// Example with a custom typology
var dolman = require(express, {typology: myCustomTypology});
```

### Responses

A wrapped express app will have an enhanced repsonse object:

```js
var app = express();

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
var app = express();

// Creating a router with a single route
var router = dolman.router([
  {
    url: '/hello',
    action: function(req, res) {
      return res.ok({hello: req.query.name});
    }
  }
]);

app.use(router);
// or
app.use('/prefix', router);
// or, typically, if you need some kind of auth
app.use('/prefix', authMiddleware, router);
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
  }
}
```

Note that the validation specifications are handled by the [typology](https://github.com/jacomyal/typology) library.

<h2 id="explanation">What on earth is a dolman?</h2>

A [dolman](https://en.wikipedia.org/wiki/Dolman) is a loose garment with narrow sleeves, an opening in the front and lavish braids. While originating from Turkey, this garment was mostly worn as a jacket by hussars.

## Roadmap

* Declarative way to transform some params?
* Default values for data?
* Object polymorphism for the controller?
* Ways to clear the cache.

## License

[MIT](LICENSE.txt)
