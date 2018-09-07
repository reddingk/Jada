'use strict';

var util = require('util');

var sse = {
    connect: function (req, res, connections) {
        try {
            var connectionId = ("id" in req.params ? req.params.id : null);

            if (connectionId !== null) {

                req.socket.setTimeout(Number.MAX_VALUE);
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                // Send connected status back to client
                res.write({ "error": null, "data": "connected" });

                (function (connections) {
                    // Add client to Connection List
                    connections.addConnection(connectionId, res);

                    // Remove Connection when it disconnects
                    req.on("close", function () {
                        connections.removeConnection(connectionId);
                    });
                })(connectionId)
            }
        }
        catch (ex) {
            console.log("Error connected to J Network: ", ex);
        }
    },
    broadcast: function (req, res, connections) {
        try {
            /* TODO: VALIDATE USER */

            var broadcastId = ("id" in req.body ? req.body.id : null);
            var message = ("message" in req.body ? req.body.message : null);

            if (broadcastId === null) {
                var list = connections.getAll();
                for (conn in list) {
                    if (conn.connection) {
                        conn.connection.write({ "data": message });
                    }
                }
            }
            else {
                var conn = connections.getConnection(broadcastId);
                conn.connection.write({ "data": message });
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