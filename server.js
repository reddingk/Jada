var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

var http = require('http').Server(app);
var io = require('socket.io')(http);

// set ports
var port = process.env.PORT || 1003;

// Set Connection Object
const Connection = require('./network/config/connections.js');
var jconnections = new Connection();

// parse application/json
app.use(bodyParser.json());

// set the static files location
app.use(express.static(path.join(__dirname, 'public')));

// Set Cors Header
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); next();  });

// All Api Routes
app.use('/japi', require('./api/controllers/routes.controller.js'));

// All Network Routes
app.use('/jnetwork', require('./network/controllers/network.controller.js')(jconnections));

// SOCKET CONNECTION
require('./network/controllers/netsock.controller.js')(io, jconnections);

http.listen(port, function(){
    console.log('Application is open on port ' + port);
});

