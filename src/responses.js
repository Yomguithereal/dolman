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
    var data = {
      status: 'ok',
      result: result
    };

    return this.json(data);
  };
};
