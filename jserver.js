var express = require('express');
var app = express();
var path = require('path');

// set ports
var port = process.env.PORT || 1003;


// Set Port
app.use(express.json())
/* For Dev Only */
.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})
.use('/api', require('./api/controllers/routes.controller.js'))
.listen(port, () => { console.log('JADA API is open on port ' + port); });