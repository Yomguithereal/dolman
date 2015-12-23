/**
 * Dolman Unit Tests
 * ==================
 *
 * The library's unit tests.
 */
var express = require('express'),
    request = require('supertest'),
    assert = require('assert'),
    dolman = require('../index.js')(express);

/**
 * Responses.
 */
describe('Responses', function() {

  it('express\'s responses should have been enhanced.', function() {
    var RESPONSES = [
      'ok',
      'created',
      'badRequest',
      'serverError',
      'notFound',
      'unauthorized',
      'forbidden'
    ];

    RESPONSES.forEach(function(key) {
      assert(typeof express.response[key] === 'function');
    });
  });
});

/**
 * Router.
 */
describe('Router', function() {

});
