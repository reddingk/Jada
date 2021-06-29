'use strict';

var util = require('util');
const log = require('../services/log.service');

var sse = {
    connect: function (req, res, connections) {
        try {
            var connectionId = ("id" in req.params ? req.params.id : null);

            if (connectionId !== null) {                
                // Send Connected Status Back To Client
                res.sse({ data: { cmd: "connStatus", srcId: connectionId, destId: connectionId, data:{status: "connected"}} });

                // Check Connection type
                var isSubConn = (connectionId !== null && connectionId.indexOf("N5") == 0);
                // Add client to Connection List & Broadcast New List
                connections.addConnection(connectionId, res, null, null, isSubConn);

                if(req.connection && req.connection.remoteAddress) {                    
                    connections.updateIPLocation(connectionId, req.connection.remoteAddress);
                }

                broadcastList(connections);

                // Remove Connection when it Disconnects & Broadcast New List
                req.on("close", function () {
                    connections.removeConnection(connectionId);
                    broadcastList(connections);
                });             
            }
        }
        catch (ex) {
            log.error("Error connecting to J Network: " + ex);
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
                    var castMsg = ("castMsg" in req.body ? req.body.castMsg : null);

                    if (broadcastId === null) {
                        var list = connections.getAll();

                        for(var j =0; j < list.length; j++) {
                            var conn = list[j];
                            if (conn.connection) {
                                conn.connection.sse({ "command": "broadcast", "data": castMsg.data });
                            }
                        }
                    }
                    else {
                        var conn = connections.getConnection(broadcastId);
                        conn.connection.sse({data: { "command":castMsg.command, "data": castMsg.data }});
                        conn.connection.end();
                    }

                    res.status(200).json({ "data": true });
                }
            });                       
        }
        catch (ex) {
            var errorMsg = "Error broadcasting message: " + ex;
            log.error(errorMsg);
            res.status(400).json({ "error": errorMsg, "data": false });
        }
    }
}
module.exports = sse;