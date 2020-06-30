var dataFilter = require('../services/dataFilter.service');
var sse = require('../services/sse.service');

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

        /* Number 5 */
        socket.on('[number5] command', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                sse.sendCmd(info.sID, info.rID, info.data.cmd, info.data.data, connections);
            }
            catch(ex){
                console.log(" [Error] Sock N5-01: ",ex);
            }
        });

        /* NaratifLa */
        socket.on('[naratifla] N5 list', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);
                if (connectionId && connectionId.socket) { 
                    var num5List = connections.getSubConnections();
                    num5List = (num5List && num5List.length > 0 ? num5List.map(function(item){ return { connectionId: item.connectionId, nickname: item.nickname }; }) : []);

                    var retObj = {"rID":info.rID, "list":num5List, "error":null};
                    io.to(connectionId.socket).emit('[naratifla] N5 list', retObj);   
                }
            }
            catch(ex){
                console.log(" [Error] Sock N01: ",ex);
            }
        });

        /* Susie */
        socket.on('[susie] view', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) { 
                    dataFilter.filterCheck(info.data, function(ret){                    
                        var retObj = {"sID":info.sID, "filter":info.data.filter, "data":ret};
                        io.to(connectionId.socket).emit('[susie] view', retObj);
                    });               
                }
            }
            catch(ex){
                console.log(" [Error] Sock S01: ",ex);
            }
        });

        /* Fillmore */
        socket.on('[fillmore] cmd', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) { 
                    var retObj = {"sID":info.sID, "data":info.data };
                    io.to(connectionId.socket).emit('[fillmore] cmd', retObj);
                }
            }
            catch(ex){
                console.log(" [Error] Sock S01: ",ex);
            }
        });
    });
}