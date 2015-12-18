/**
 * Dolman Responses
 * =================
 *
 * Overloading the express Response object to provide the user with handy
 * and semantic method to send back data to the client.
 */
module.exports = function(express) {
  var response = express.response;

  /**
   * Ok.
   */
  response.ok = function(result) {
    var response = {
      status: 'ok',
      code: 200,
      result: result
    };

    return this.json(data);
  };

  /**
   * Bad request.
   */
  response.badRequest = function(expecting) {
    var response = {
      status: 'error',
      code: 400,
      error: {
        message: 'Bad Request'
      }
    };

    if (expecting)
      response.error.expecting = expecting;

    return this.status(400).json(response);
  };

  /**
   * Server Error.
   */
  response.serverError = function(err) {

    // TEMP: dev logging
    console.log(err);

    this.status(500).json({
      status: 'error',
      code: 500,
      error: {
        message: 'Internal Server Error'
      }
    });
  };

  /**
   * Not Found.
   */
  response.notFound = function(reason) {
    var response = {
      status: 'error',
      code: 404,
      error: {
        message: 'Not Found'
      }
    };

    if (reason)
      response.error.reason = reason;

    this.status(404).json(response);
  };

  /**
   * Unauthorized.
   */
  express.response.unauthorized = function() {
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
  express.response.forbidden = function() {
    this.status(403).json({
      status: 'error',
      code: 403,
      error: {
        message: 'Forbidden'
      }
    });
  };
};
