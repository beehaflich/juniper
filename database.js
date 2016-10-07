

var configuration = require('./configuration.js');

var pg = require('pg');

// postgres://username:password@host:port/database
var connectionString = (
  'postgres://' +
  configuration.database.username + ':' +
  configuration.database.password + '@' +
  configuration.database.host + ':' +
  configuration.database.port + '/' +
  configuration.database.database
);


module.exports = {
  'query': function(query_statement, success_callback, error_callback) {
    if (configuration.debug.log) {
      console.log(query_statement);
    }

    var client = new pg.Client(connectionString);
    client.connect();
    client.on('drain', client.end.bind(client));

    var query = client.query(query_statement, function(error, result) {
      if (error) {
        error_callback(error);
        return;
      }
      success_callback(result.rows);
    });
  }
};

