/**
 * Dolman Responses
 * =================
 *
 * Overloading an express app's Response object to provide the user with handy
 * and semantic method to send back data to the client.
 */
module.exports = function(app, logger) {
  var response = app.response;

  /**
   * Ok.
   */
  response.ok = function(result) {
    var data = {
      status: 'ok',
      code: 200,
      result: result
    };

    if (this.__shouldBeCached)
      this.__sentData = result;

    return this.json(data);
  };

  /**
   * Created.
   */
  response.created = function(result) {
    var data = {
      status: 'ok',
      code: 201,
      result: result
    };

    if (this.__shouldBeCached)
      this.__sentData = result;

    return this.status(201).json(data);
  };

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
      logger.error(err);

    this.status(500).json({
      status: 'error',
      code: 500,
      error: {
        message: 'Internal Server Error'
      }
    });
  };
};
