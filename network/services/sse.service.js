'use strict';

var util = require('util');

var sse = {
    connect: function (req, res, connections) {
        try {
            var connectionId = ("id" in req.params ? req.params.id : null);

            if (connectionId !== null) {                
                // Send Connected Status Back To Client
                res.sse({data:'connected'});

                // Add client to Connection List
                connections.addConnection(connectionId, res);

                // Remove Connection when it disconnects
                req.on("close", function () {
                    connections.removeConnection(connectionId);
                });             
            }
        }
        catch (ex) {
            console.log("Error connecting to J Network: ", ex);
        }
    },
    broadcast: function (req, res, connections) {
        try {
            /* TODO: VALIDATE USER */

            var broadcastId = ("id" in req.body ? req.body.id : null);
            var message = ("message" in req.body ? req.body.message : null);

            if (broadcastId === null) {
                var list = connections.getAll();

                for(var j =0; j < list.length; j++) {
                    var conn = list[j];
                    if (conn.connection) {
                        conn.connection.sse({ "data": message });
                    }
                }
            }
            else {
                var conn = connections.getConnection(broadcastId);
                conn.connection.sse({ "data": message });
                conn.connection.end();
            }

            res.status(200).json({ "data": true });
        }
        catch (ex) {
            var errorMsg = "Error broadcasting message: " + ex;
            console.log(errorMsg);
            res.status(400).json({ "error": errorMsg, "data": false });
        }
    },
    getConnections: function (req, res, connections) {
        try {
            var userId = ("uid" in req.body ? req.body.uid : null);

            /* TODO: VALIDATE USER */

            // Get List of Connections
            var list = connections.getAll();
            res.status(200).json({ "data": list });
        }
        catch (ex) {
            var errorMsg = "Error retrieving list: " + ex;
            console.log(errorMsg);
            res.status(400).json({ "error": errorMsg });
        }
    }
}

module.exports = sse;