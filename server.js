
// time tracker
// spent ~ 1 hour setting up my webserver + this file

/**
 * Import configuration
 * If this throws an error, you need a valid configuration file
 * @type {Object}
 */
var configuration = require('./configuration.js');


/**
 * Create main server handler
 * Parses a GET request and sends it to the proper handler module
 */
var http = require('http');
http.createServer(function(request, response) {
  response.writeHead(200, {'Content-Type': 'text/json'});

  // the spec was just GET requests so that's all I'll handle here
  var url = request.url;
  if (configuration.debug.log) {
    console.log('Request: "' + url + '"');
  }
  var cls = url.substr(1, url.indexOf('?') - 1);

  if (!cls) {
    response.end();
  }

  // grab a JSON-type object of our parsed args
  var split_args = url.substr(url.indexOf('?') + 1).split('&');
  var args = {};
  var i, equals_index, key, value;
  var len = split_args.length;
  for (i = 0; i < len; i++) {
    equals_index = split_args[i].indexOf('=');
    if (equals_index !== -1) {
      key = split_args[i].substr(0, equals_index);
      value = split_args[i].substr(equals_index + 1);
    } else {
      key = split_args[i];
      value = null;
    }
    args[key] = value;
  }

  // since we only have 2, just whitelist
  var whitelist = ['topActiveUsers', 'users'];
  if (whitelist.indexOf(cls) !== -1) {
    var processor = require('./' + cls + '.js');
    processor(args, function(result) {
      response.end(JSON.stringify(result));
    });
  } else {
    response.end();
  }
}).listen(configuration.server.port);
if (configuration.debug.log) {
  console.log('Server running on port ' + configuration.server.port);
}

