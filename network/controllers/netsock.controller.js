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
        var connStatus = connections.addSocket(userId, userToken, socket.id);
        connections.updateIPLocation(userId, ipAddress);

        if(userId && !connStatus) {
            // Disconnect user
            connections.removeSocket(userId);
            if(socket.id){
                io.to(socket.id).emit('disable_connection', {"status":false});
            }
        }
        
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

        // jada direct data connection
        socket.on('jada direct data', function (info) {
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.rID);

            if (connectionId && connectionId.socket) {                                             
                if(info.functionName !== null && info.functionName !== ""){
                    dataFilter.jadaDirectData(info.functionName, info.data, function(ret){
                        var retObj = {"rID":info.rID, "functionName":info.functionName, "data":ret};
                        io.to(connectionId.socket).emit('jada direct data', retObj);
                    });
                }   
                else {
                    // Default return
                    var retObj = {"rID":info.data.rID, "functionName":info.functionName, "error":"Function Type Missing"};
                    io.to(connectionId.socket).emit('jada direct data', retObj);
                }        
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

        /* NaratifLa */
        socket.on('[naratifla] #5 list', function (info) {
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.rID);
            if (connectionId && connectionId.socket) { 
                var num5List = connections.getSubConnections();

                var retObj = {"rID":info.rID, "list":num5List, "error":null};
                io.to(connectionId.socket).emit('[naratifla] #5 list', retObj);   
            }
        });

        /* Susie */
        socket.on('[susie] view', function (info) {
            /* TODO: AUTHENTICATE USER */
            var connectionId = connections.getConnection(info.rID);

            if (connectionId && connectionId.socket) { 
                dataFilter.filterCheck(info.data, function(ret){                    
                    var retObj = {"sID":info.sID, "filter":info.data.filter, "data":ret};
                    io.to(connectionId.socket).emit('[susie] view', retObj);
                });               
            }
        });

    });
}