
var configuration = require('./configuration.js');


/**
 * Grab a page of the top active users
 *
 * Spec:
 * Returns user info, count of applications in the last week and the names of the 3 latest applied listings.
 *
 * @param {Object} args
 * @param {Function} done
 * @return {void}
 */
module.exports = function(args, done) {
  var page = args.page || 0;
  var rowsPerPage = 10;
  // to support different page lengths:
  // var rowsPerPage = args.rowsPerPage || 10;

  var database = require('./database.js');

  // get the list of users; returns basic user data + count
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
    'values': [rowsPerPage, page * rowsPerPage]
  }, function(topResult) {
    // done(topResult);
    if (!topResult.length) {
      done([]);
    }
    var ids = [];
    var users = {};
    var i;
    var len = topResult.length;
    // http://stackoverflow.com/questions/10720420/node-postgres-how-to-execute-where-col-in-dynamic-value-list-query
    var params = [];
    for (i = 0; i < len; i++) {
      ids.push(topResult[i].id);
      users[topResult[i].id] = topResult[i];
      users[topResult[i].id]['listings'] = [];
      params.push('$' + (i + 1));
    }

    // grab the partition table of recent listing names
    // returns one row per listing, in order
    var listingQuery = (
      'select a.name, a.user_id ' +
      'from (' +
      '  select *, row_number() over (partition by user_id order by applications.created_at desc) as row_id ' +
      '  from applications join listings on applications.listing_id = listings.id' +
      ') as a ' +
      'where row_id < 4 and a.user_id in (' + params.join(', ') + ') ' +
      'order by user_id'
    );
    database.query({
      'text': listingQuery,
      'values': ids
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

      // getting the partition table could have unsorted it
      // quicksort is pretty fast on already-sorted arrays, anyway
      done(values.sort(function(a, b) {
        return (b.count - a.count) || (b.id - a.id);
      }));
    }, function(error) {
      done(error);
    });
  }, function(error) {
    done(error);
  });
};


