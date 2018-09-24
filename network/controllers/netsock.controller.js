var dataFilter = require('../services/dataFilter.service');

module.exports = function (io, connections) {
    // socket connection
    io.on('connection', function (socket) {
        var userId = socket.handshake.query.userid;

        // add socket to connection item
        connections.addSocket(userId, socket.Id);

        // socket disconnect
        socket.on('disconnect', function () {
            connections.removeSocket(userId);
        });

        // socket direct connect
        socket.on('direct connect', function (info) {
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.userId).socket;
            if (connectionId) {                
                dataFilter.filterCheck(info, function(ret){
                    io.to(connectionId).emit('direct connect', ret);
                });                
            }
        });

        // socket direct connect
        socket.on('spark connection', function (info) {
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.userId);

            if (connectionId && connectionId.connection && !connectionId.socket) {                                
                connectionId.connection.sse({"data":{ "command": "sockControl", "data": "open" }});                                             
            }
        });
    });
}