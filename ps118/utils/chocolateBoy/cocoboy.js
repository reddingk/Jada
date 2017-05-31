// server.js
// modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var io = require('socket.io-client');

// set ports
var port = process.env.PORT || 2626;

// get all data of the body (POST) params
// parse application/json
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json'}) );

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE
app.use(methodOverride('X-HTTP-Method-Override'));

// SOCKET CONNECTION
require('./cocoboy_/server.config.js')(io);

// start app
app.listen(port);
// User message
console.log('Application is open on port ' + port);

//http.listen(port, function(){ console.log('Application is open on port ' + port);});