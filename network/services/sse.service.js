'use strict';

var util = require('util');
var jauth = require('../../security/services/auth.service');

var sse = {
    connect: function (req, res, connections) {
        try {
            var connectionId = ("id" in req.params ? req.params.id : null);

            if (connectionId !== null) {                
                // Send Connected Status Back To Client
                res.sse({data:{"command":"connection", "data":'connected'}});

                // Add client to Connection List & Broadcast New List
                connections.addConnection(connectionId, null, res, null);
                var ipAddress = (req.connection ? req.connection.remoteAddress : null);
                connections.updateIPLocation(connectionId, ipAddress);

                broadcastList(connections);

                // Remove Connection when it Disconnects & Broadcast New List
                req.on("close", function () {
                    connections.removeConnection(connectionId);
                    broadcastList(connections);
                });             
            }
        }
        catch (ex) {
            console.log("Error connecting to J Network: ", ex);
        }
    },
    broadcast: function (req, res, connections) {
        try {            
            var userId = ("userId" in req.body ? req.body.userId : null);
            var token = ("token" in req.body ? req.body.token : null); 
            /* Validate User */
            jauth.validateUser(userId, token, connections, function(ret){
                if(ret.statusCode <= 0){ 
                    res.status(400).json({ "error": ret.status, "data": false });
                }
                else {
                    var broadcastId = ("id" in req.body ? req.body.id : null);
                    var message = ("message" in req.body ? req.body.message : null);

                    if (broadcastId === null) {
                        var list = connections.getAll();

                        for(var j =0; j < list.length; j++) {
                            var conn = list[j];
                            if (conn.connection) {
                                conn.connection.sse({ "command": "broadcast", "data": message });
                            }
                        }
                    }
                    else {
                        var conn = connections.getConnection(broadcastId);
                        conn.connection.sse({data: { "command":"broadcast", "data": message }});
                        conn.connection.end();
                    }

                    res.status(200).json({ "data": true });
                }
            });                       
        }
        catch (ex) {
            var errorMsg = "Error broadcasting message: " + ex;
            console.log(errorMsg);
            res.status(400).json({ "error": errorMsg, "data": false });
        }
    },
    getConnections: function (req, res, connections) {
        try {
            var userId = ("userId" in req.body ? req.body.userId : null);
            var token = ("token" in req.body ? req.body.token : null); 
            /* Validate User */
            jauth.validateUser(userId, token, connections, function(ret){
                if(ret.statusCode <= 0){ 
                    res.status(400).json({ "error": ret.status, "data": false });
                }
                else { 
                    // Get List of Connections
                    var list = connections.getAll();
                    res.status(200).json({ "data": list });
                }
            });           
        }
        catch (ex) {
            var errorMsg = "Error retrieving list: " + ex;
            console.log(errorMsg);
            res.status(400).json({ "error": errorMsg });
        }
    }
}

module.exports = sse;

/* Private Functions */

// Broadcast Connection List
function broadcastList(connections) {
    var self = this;

    try {
        var list = connections.getAll();
        var reduceList = list.map(r => ({connectionId: r.connectionId, nickname: r.nickname}));

        var jsonObj = { "command":"connectionList", "data": reduceList };
        
        for (var i = 0; i < list.length; i++) {
            if (!list[i].connectionId.startsWith("CB-")) {
                var conn = list[i];
                if (conn.connection) {
                    conn.connection.sse({"data":jsonObj});
                }
            }
        }
    }
    catch (ex) {
        var errorMsg = "Error broadcasting list: " + ex;
        console.log(errorMsg);
    }
}


