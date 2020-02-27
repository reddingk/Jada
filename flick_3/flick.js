// Application CONNECTION
var os = require('os');
var util = require('util');
var EventSource = require('eventSource');

const BRAIN = require('./app/fbrain.js');

var srcLoc = 'http://localhost:1003';
var id = "F3-" + os.hostname();
var srcURL = util.format('%s/jnetwork/connect/%s', srcLoc, id);

const fbrain = new BRAIN(id);
const eSource = new EventSource(srcURL);


// When connection is made
eSource.onopen = function () {
    console.log("connected to jnetwork");
}

// When connection message is recieved
eSource.onmessage = function (e) {
    try {
        var msgData = JSON.parse(e.data);
        
        if(msgData.command in fbrain){
            fbrain[msgData.command](msgData.data, function(res){
                console.log(res);
            });
        }
        else if (msgData.command == "connection") {
            console.log("Connection Status: ", msgData.data);
        }
        else{
            console.log(" [WARNING] Invalid Command: ", msgData.command);
        }
    }
    catch(ex){
        console.log(" [ERROR] recieving message: ",ex);
    }
}

// When there is an error with connection
eSource.onerror = function () {
    console.log(" [ERROR] jnetwork connection");
}