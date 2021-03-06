

var configuration = require('./configuration.js');


/**
 * Get information about a single user
 *
 * Spec:
 * Takes user id and returns:
 * user info;
 * connected companies;
 * listings created by the user;
 * applications the user has made with the info of the listing the application is made to.
 *
 * @param {Object} args
 * @param {Function} done
 * @return {void}
 */
module.exports = function(args, done) {
  var id = args.id;

  var database = require('./database.js');

  // init user object
  var user = {
    'id': null,
    'name': null,
    'createdAt': null,
    'companies': null,
    'createdListings': null,
    'applications': null
  };

  // check that all secondary queries have returned
  // if they have, return the complete user object
  var maybe_done = function() {
    if (
      user.id &&
      user.applications &&
      user.companies &&
      user.createdListings
    ) {
      done(user);
    }
  }

  // query for basic user information
  database.query({
    'text': 'select * from users where id = $1',
    'values': [id]
  }, function(result) {
    user.name = result[0].name;
    user.createdAt = result[0].createdAt;
    user.id = result[0].id;
    maybe_done();
  }, function(error) {
    done(error);
  });

  // query for applications (+ listings, 1->1)
  var applicationQuery = (
    'select applications.*, listings.id listing_id, listings.name listing_name, listings.description listing_description ' +
    'from applications join listings on applications.listing_id = listings.id ' +
    'where applications.user_id = $1 limit 5'
  );
  database.query({
    'text': applicationQuery,
    'values': [id]
  }, function(result) {
    var i;
    var len = result.length;
    var applications = [];
    for (i = 0; i < len; i++) {
      applications.push({
        'id': result[i].id,
        'createdAt': result[i].created_at,
        'listing': {
          'id': result[i].listing_id,
          'name': result[i].listing_name,
          'description': result[i].listing_description
        },
        'coverLetter': result[i].cover_letter
      });
    }
    user.applications = applications;
    maybe_done();
  }, function(error) {
    done(error);
  });

  // query for created listings
  var listingQuery = (
    'select listings.id, listings.created_at, listings.name, listings.description ' +
    'from listings where listings.created_by = $1 limit 5'
  );
  database.query({
    'text': listingQuery,
    'values': [id]
  }, function(result) {
    var i;
    var len = result.length;
    var createdListings = [];
    for (i = 0; i < len; i++) {
      createdListings.push({
        'id': result[i].id,
        'createdAt': result[i].created_at,
        'name': result[i].name,
        'description': result[i].description
      });
    }
    user.createdListings = createdListings;
    maybe_done();
  }, function(error) {
    done(error);
  });


  // query for companies via teams
  var companyQuery = (
    'select companies.*, teams.contact_user ' +
    'from teams join companies on teams.company_id = companies.id ' +
    'where teams.user_id = $1 limit 5'
  );
  database.query({
    'text': companyQuery,
    'values': [id]
  }, function(result) {
    var i;
    var len = result.length;
    var companies = [];
    for (i = 0; i < len; i++) {
      companies.push({
        'id': result[i].id,
        'createdAt': result[i].created_at,
        'name': result[i].name,
        'isContact': result[i].contact_user
      });
    }
    user.companies = companies;
    maybe_done();
  }, function(error) {
    done(error);
  });
};



