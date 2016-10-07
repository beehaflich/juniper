

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


// http://stackoverflow.com/a/19282657/5032228
module.exports = {
   query: function(text, values, callback) {
      pg.connect(connectionString, function(err, client, done) {
        client.query(text, values, function(err, result) {
          done();
          callback(err, result);
        });
      });
   }
};
