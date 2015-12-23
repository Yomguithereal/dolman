/**
 * Dolman Test Helpers
 * ====================
 *
 * Miscellaneous helper functions.
 */
var express = require('express'),
    dolman = require('../index.js')(express);

function makeApp() {
  var app = express();
}

module.exports = {
  app: makeApp
};
