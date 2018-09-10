var os = require('os');
var util = require('util');
var EventSource = require('eventSource')

var srcLoc = 'http://localhost:1003';
var id = "CB-" + os.hostname();

var srcURL = util.format('%s/jnetwork/connect/%s', srcLoc, id);

var eSource = new EventSource(srcURL);

module.exports = function (io) {
    // When connection is made
    eSource.onopen = function () {
        console.log("connected to jnetwork");
    }

    // When connection message is recieved
    eSource.onmessage = function (e) {
        console.log(e.data);
    }

    // When there is an error with connection
    eSource.onerror = function () {
        console.log("error with jnetwork connection");
    }
}