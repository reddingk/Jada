var express = require('express');
var app = express();

// set ports
var port = process.env.PORT || 2626;
// get all data of the body (POST) params
// parse application/json
//app.use(bodyParser.json());

// parse application/vnd.api+json as json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: true }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE
//app.use(methodOverride('X-HTTP-Method-Override'));

// SOCKET CONNECTION
require('./cocoboy_3/server.config.js');

// start app
//app.listen(port);