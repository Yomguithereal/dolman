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
      statusCode: 200,
      result: result
    };

    return this.json(data);
  };

  /**
   * Bad request.
   */
  response.badRequest = function(expecting) {
    var response = {
      status: 'ok',
      statusCode: 400,
      error: {
        title: 'Bad Request'
      }
    };

    if (expecting)
      response.error.expecting = expecting;

    return this.status(400).json(response);
  };
};
