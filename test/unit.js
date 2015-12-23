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
      {method: 'ok'},
      {method: 'created'},
      {method: 'badRequest'},
      {method: 'serverError'},
      {method: 'notFound'},
      {method: 'unauthorized'},
      {method: 'forbidden'}
    ];

    RESPONSES.forEach(function(response) {
      assert(typeof express.response[response.method] === 'function');
    });
  });
});

/**
 * Router.
 */
describe('Router', function() {
  // API
  // WORKING
});
