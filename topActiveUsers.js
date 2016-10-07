
var configuration = require('./configuration');

var topActiveUsers = function(args) {
  var page = args.page || 0;

  var database = require('./database');
  // database.query('select * from users', )

  return {'args': args, 'foo': 'bar'};
};

module.exports = topActiveUsers;

