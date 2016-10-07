
var configuration = require('./configuration.js');

var topActiveUsers = function(args, done) {
  var page = args.page || 0;
  var rows_per_page = 10;

  var database = require('./database.js');
  database.query({
    'text': 'select * from users limit $1 offset $2',
    'values': [rows_per_page, page * rows_per_page]
  }, function(result) {
    done(result);
  }, function(error) {
    done(error);
  });
};

module.exports = topActiveUsers;

