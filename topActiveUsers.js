
var configuration = require('./configuration.js');

var topActiveUsers = function(args, done) {
  var page = args.page || 0;
  var rows_per_page = 10;

  var database = require('./database.js');

  var topQuery = (
    'select users.id, users.name, users.created_at, count(applications.id) ' +
    'from users join applications on (applications.user_id = users.id) ' +
    'where applications.created_at > (current_date - interval \'1 week\') ' +
    'group by users.id ' +
    // extra order by user here for more consistent sorting/pagination
    'order by count(applications.id) desc, users.id desc ' +
    'limit $1 offset $2'
  );

  database.query({
    'text': topQuery,
    'values': [rows_per_page, page * rows_per_page]
  }, function(topResult) {
    // done(topResult);
    if (!topResult.length) {
      done([]);
    }
    var ids = [];
    var users = {};
    var i;
    var len = topResult.length;
    for (i = 0; i < len; i++) {
      ids.push(topResult[i].id);
      users[topResult[i].id] = topResult[i];
      users[topResult[i].id]['listings'] = [];
    }

    var listingQuery = (
      'select a.name, a.user_id ' +
      'from (' +
      '  select *, row_number() over (partition by user_id order by applications.created_at desc) as row_id ' +
      '  from applications join listings on applications.listing_id = listings.id' +
      ') as a ' +
      'where row_id < 4 and a.user_id in (' + ids.join(',') + ') ' +
      'order by user_id'
    );
    database.query({
      'text': listingQuery,
    }, function(listingResult) {
      // console.log(listingResult);
      var i = 0;
      var len = listingResult.length;
      for (i = 0; i < len; i++) {
        users[listingResult[i].user_id]['listings'].push(
          listingResult[i].name
        );
      }

      var values = [];
      for (var id in users) {
        if (users.hasOwnProperty(id)) {
          values.push(users[id]);
        }
      }
      done(values.sort(function(a, b) {
        return b.count - a.count;
      }));
    }, function(error) {
      done(error);
    })

  }, function(error) {
    done(error);
  });
};

module.exports = topActiveUsers;

