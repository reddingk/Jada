var dataFilter = require('../services/dataFilter.service');

module.exports = function (io, connections) {
    // socket connection
    io.on('connection', function (socket) {
        var userId = socket.handshake.query.userid;

        // add socket to connection item
        connections.addSocket(userId, socket.id);

        // socket disconnect
        socket.on('disconnect', function () {
            connections.removeSocket(userId);
        });

        // socket direct connect
        socket.on('direct connection', function (info) {

            /* TODO: AUTHENTICATE USER */

            var connectionId = connections.getConnection(info.sID);
            if (connectionId && connectionId.socket) {                
                dataFilter.filterCheck(info.data, function(ret){
                    //console.log(" [DEBUG]: con ", connectionId, " | ", ret);
                    var retObj = {"rID":info.data.rID, "command":info.data.command, "data":ret};
                    io.to(connectionId.socket).emit('direct connection', retObj);
                });                
            }
        });

        // socket direct connect
        socket.on('spark connection', function (info) {
            console.log(" [DEBUG]: Spark Connection");
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.sID);

            if (connectionId && connectionId.connection && !connectionId.socket) {                                
                connectionId.connection.sse({"data":{ "command": "sockControl", "data": "open" }});                                             
            }
        });
    });
}