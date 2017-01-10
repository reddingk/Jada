//Send Email from Node
//https://codeforgeek.com/2014/07/send-e-mail-node-js/

// server.js
// modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var database = require('./jada_/config/database');

// configuration

// config files
mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrl);

// set ports
var port = process.env.PORT || 1003;

// DATABASE
require('./jada_/config/routes.js')(app);

// get all data of the body (POST) params
// parse application/json
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json'}) );

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE
app.use(methodOverride('X-HTTP-Method-Override'));

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));

// routes
// Route for database set up
//require('./app/routes')(app);

// start app
app.listen(port);
// User message
console.log('Application is open on port ' + port);
