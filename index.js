/**
 * Dolman API Endpoint
 * ====================
 *
 * Exposing the library's utilities.
 */
var responses = require('./src/responses.js'),
    Typology = require('typology');

module.exports = function(express, opts) {
  opts = opts || {};

  // Building internal typology
  var types;

  if (opts.typology instanceof Typology)
    types = opts.typology;
  else
    types = new Typology(opts.typology || {});

  // Applying responses to express
  responses(express);
};
