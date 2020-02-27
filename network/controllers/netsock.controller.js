var dataFilter = require('../services/dataFilter.service');

// Auth Services
var jauth = require('../../security/services/auth.service');

module.exports = function (io, connections) {
    // socket connection
    io.on('connection', function (socket) {
        var userId = socket.handshake.query.userId;
        var userToken = socket.handshake.query.token;
        var ipAddress = socket.handshake.address;

        //console.log(" [Debug] socket: ");
        //console.log(socket.handshake);
        //console.log(socket.request);

        // add socket to connection item
        connections.addSocket(userId, userToken, socket.id);
        connections.updateIPLocation(userId, ipAddress);

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
                    var retObj = {"rID":info.data.rID, "command":info.data.command, "data":ret};
                    io.to(connectionId.socket).emit('direct connection', retObj);
                });                
            }
        });

        // socket direct connect
        socket.on('jada', function (info) {

            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.rID);

            if (connectionId && connectionId.socket) {                                             
                if(info.type == "phrase"){
                    dataFilter.jadaConvo(info, info.rID, function(ret){
                        var retObj = {"rID":info.rID, "input":info.input, "type":info.type,"data":ret};
                        io.to(connectionId.socket).emit('jada', retObj);
                    });
                }   
                else {
                    // Default return
                    var retObj = {"rID":info.data.rID, "input":info.input, "type":info.type,"error":"Currently do not support this type"};
                    io.to(connectionId.socket).emit('jada', retObj);
                }        
            }
        });

        // socket spark connection
        socket.on('spark connection', function (info) {
            console.log(" [DEBUG]: Spark Connection");
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.sID);

            if (connectionId && connectionId.connection && !connectionId.socket) {                                
                connectionId.connection.sse({"data":{ "command": "sockControl", "data": "open" }});                                             
            }
        });

        // socket direct connect
        socket.on('flick connection', function (info) {

            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.sID);
            if (connectionId && connectionId.socket) {              
                dataFilter.filterCheck(info.data, function(ret){                    
                    var retObj = {"rID":info.data.rID, "command":info.data.command, "data":ret};
                    io.to(connectionId.socket).emit('direct connection', retObj);
                });                
            }
        });

        // socket authenticate user
        socket.on('jauth', function (info) {
            //console.log(" [DEBUG]: Authorize User");
            
            // Send Obj to Auth Service
            jauth.loginUser(info, connections, ipAddress, function(ret){                
                io.to(socket.id).emit('jauth', ret);
            });
        });
    });
}