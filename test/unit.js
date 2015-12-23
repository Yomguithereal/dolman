/**
 * Dolman Unit Tests
 * ==================
 *
 * The library's unit tests.
 */
var helpers = require('./helpers.js'),
    express = require('express'),
    assert = require('assert');

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
