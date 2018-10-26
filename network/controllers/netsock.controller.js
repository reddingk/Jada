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
            console.log(" [DEBUG]: Direct Connection");
            console.log(info.userId);

            /* TODO: AUTHENTICATE USER */

            var connectionId = connections.getConnection(info.userId).socket;
            if (connectionId) {                
                dataFilter.filterCheck(info.data, function(ret){
                    //console.log(" [DEBUG]: con ", connectionId, " | ", ret);
                    io.to(connectionId).emit('direct connection', ret);
                });                
            }
        });

        // socket direct connect
        socket.on('spark connection', function (info) {
            console.log(" [DEBUG]: Spark Connection");
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.userId);

            if (connectionId && connectionId.connection && !connectionId.socket) {                                
                connectionId.connection.sse({"data":{ "command": "sockControl", "data": "open" }});                                             
            }
        });
    });
}