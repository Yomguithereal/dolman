/**
 * Dolman Responses
 * =================
 *
 * Overloading an express app's Response object to provide the user with handy
 * and semantic method to send back data to the client.
 */
var helpers = require('./helpers.js');

var isPlainObject = helpers.isPlainObject;

module.exports = function(app, logger, types) {
  var response = app.response;

  function applyMask(object, def) {
    var output = {};

    if (!isPlainObject(object) || !isPlainObject(def))
      return object;

    for (var k in def)
      output[k] = applyMask(object[k], def[k]);

    return output;
  }

  function makeSuccess(code) {
    return function(result) {
      var maskedResult = result,
          def;

      // Do we need to apply a mask?
      if (this.__mask) {
        def = this.__mask;

        // We only keep relevant keys
        maskedResult = applyMask(result, def);

        // Then we check is the sent data does abide to the definition
        if (!types.check(def, maskedResult)) {
          logger.warn('Mask Warning', {
            mask: def,
            data: result
          });
        }
      }

      var data = {
        status: 'ok',
        code: code,
        result: maskedResult
      };

      if (this.__shouldBeCached)
        this.__sentData = maskedResult;

      return this.status(code).json(data);
    };
  }

  /**
   * Ok.
   */
  response.ok = makeSuccess(200);

  /**
   * Created.
   */
  response.created = makeSuccess(201);

  /**
   * Bad request.
   */
  response.badRequest = function(reason) {
    var data = {
      status: 'error',
      code: 400,
      error: {
        message: 'Bad Request'
      }
    };

    if (reason)
      data.error.reason = reason;

    return this.status(400).json(data);
  };

  /**
   * Unauthorized.
   */
  response.unauthorized = function() {
    this.status(401).json({
      status: 'error',
      code: 401,
      error: {
        message: 'Unauthorized'
      }
    });
  };

  /**
   * Forbidden.
   */
  response.forbidden = function() {
    this.status(403).json({
      status: 'error',
      code: 403,
      error: {
        message: 'Forbidden'
      }
    });
  };

  /**
   * Not Found.
   */
  response.notFound = function(reason) {
    var data = {
      status: 'error',
      code: 404,
      error: {
        message: 'Not Found'
      }
    };

    if (reason)
      data.error.reason = reason;

    this.status(404).json(data);
  };

  /**
   * Server Error.
   */
  response.serverError = function(err) {
    if (err)
      logger.error('Server Error', err);

    this.status(500).json({
      status: 'error',
      code: 500,
      error: {
        message: 'Internal Server Error'
      }
    });
  };
};
