const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const https = require('https').createServer({
                    key: fs.readFileSync('server.key'),
                    cert: fs.readFileSync('server.cert')
                }, app);
const io = require('socket.io')(https);

// set ports
var port = process.env.PORT || 1003;

// Set Connection Object
const Connection = require('./network/config/connections.js');
var jconnections = new Connection();

// Set File Store
const FileStore = require('./network/config/fileStore.js');
var jfilestore = new FileStore();

// parse application/json
app.use(bodyParser.json());

// set the static files location
app.use(express.static(path.join(__dirname, 'public')));

// Set Cors Header
app.use((req, res, next) => { 
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// All Api Routes
app.use('/japi', require('./api/controllers/routes.controller.js'));

// All Network Routes
app.use('/jnetwork', require('./network/controllers/network.controller.js')(jconnections));

// SOCKET CONNECTION
require('./network/controllers/netsock.controller.js')(io, jconnections, jfilestore);

https.listen(port, function(){
    console.log('Application is open on port ' + port);
});

