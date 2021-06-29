const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const http = require('http').Server(app);


const io = require('socket.io')(http, { 
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// set ports
var port = process.env.PORT || 1003;


// Set Connection Object
const Connection = require('./server/models/connections.js');
var jconnections = new Connection();

// parse application/json
app.use(bodyParser.json());

// set the static files location
app.use(express.static(path.join(__dirname, 'public')));

// Set Cors Header
app.use((req, res, next) => { 
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept");
    next();
});

// All Api Routes
app.use('/japi', require('./server/controllers/routes.controller.js'));

// SOCKET CONNECTION
require('./server/controllers/netsock.controller.js')(io, jconnections);

http.listen(port, function(){
    console.log('Application is open on port ' + port);
});