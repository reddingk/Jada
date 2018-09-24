var os = require('os');
var util = require('util');
var EventSource = require('eventSource');

const BRAIN = require('./cbrain.js');

var srcLoc = 'http://localhost:1003';
var id = "CB-" + os.hostname();

var srcURL = util.format('%s/jnetwork/connect/%s', srcLoc, id);

var eSource = new EventSource(srcURL);

var cbrain = new BRAIN(id);

// When connection is made
eSource.onopen = function () {
    console.log("connected to jnetwork");
}

// When connection message is recieved
eSource.onmessage = function (e) {
    var msgData = dataToJson(e.data);
    
    if(msgData.command in cbrain){
        cbrain[msgData.command](msgData.data, function(res){
            console.log(res);
        });
    }
}

// When there is an error with connection
eSource.onerror = function () {
    //console.log("error with jnetwork connection");
}

function dataToJson(dataObj){
    var ret = {};
    try {
        ret = JSON.parse(dataObj);
    }
    catch(ex){}
    return ret;
}