// server.js
// modules
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var io = require('socket.io-client');

var ps = require('ps-node');
var netstat = require('node-netstat');
var underscore = require('underscore');

// set ports
var port = process.env.PORT || 2828;

// get all data of the body (POST) params
// parse application/json
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json'}) );

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE
app.use(methodOverride('X-HTTP-Method-Override'));

//OPENCV TEST
//require('./msphoebe_/motion.test.js')(io);
require('./msphoebe_/opencv.test.js')(io);

// list all running processes
var net_data = [];
netstat({
    filter: {
      local: { port: 2828}      
    },
    limit: 1,
    done: function(err){      
            
      if(net_data.length < 1){
        /*app.listen(port, function(){
          // User message
          console.log('[Clean] Application is open on port %s', port);
        });*/
      }
      else {    
        console.log("Removing Old Process");
        var pidStr = ''+net_data[0].pid+'';
        ps.kill( pidStr, 'SIGKILL', function( err) {
            if (err) { throw new Error( err ); }
            else {
              console.log( 'Process %s has been killed without a clean-up!', pidStr );
              /*app.listen(port, function(){
                // User message
                console.log('[Fixed] Application is open on port %s', port);
              });*/
            }
        });
      } 
    }
}, function (data) { net_data.push(data);});


