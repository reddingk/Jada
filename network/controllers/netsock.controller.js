const ss = require('socket.io-stream');
const fs = require('fs');
const dataFilter = require('../services/dataFilter.service');
const sse = require('../services/sse.service');

// Auth Services
const jauth = require('../../security/services/auth.service');

const Tool = require('../../jada_3/jtools.js');
const jtool = new Tool();
const configLoc = (process.env.CONFIG_LOC ? process.env.CONFIG_LOC : "/jada/localConfig");

module.exports = function (io, connections, filestore) {
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
            
            // Send Obj to Auth Service
            jauth.loginUser(info, connections, ipAddress, function(ret){                
                io.to(socket.id).emit('jauth', ret);
            });
        });

        // socket validate user
        socket.on('jauth validate', function (info) {
            
            // Send Obj to Auth Service
            jauth.validateUser(info.userId, info.token, connections, function(ret){                
                io.to(socket.id).emit('jauth validate', ret);
            });
        });

        /* Number 5 */
        socket.on('[number5] command', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);
                
                if (info.socket === true && connectionId && connectionId.socket) {
                    var sockMsg = { data: { "cmd":info.data.cmd, "srcId":info.sID, "destId":info.rID, "data": info.data.data }};
                    io.to(connectionId.socket).emit('[number5] command', sockMsg);
                }
                else {
                    sse.sendCmd(info.sID, info.rID, info.data.cmd, info.data.data, connections);
                }
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock N5-01: " + ex);
            }
        });

        /* NaratifLa */
        socket.on('[naratifla] N5 list', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);
                if (connectionId && connectionId.socket) { 
                    var num5List = connections.getSubConnections();
                    num5List = (num5List && num5List.length > 0 ? num5List.map(function(item){ return { connectionId: item.connectionId, nickname: item.nickname, location: (item.location ? item.location : null) }; }) : []);

                    var retObj = {"rID":info.rID, "list":num5List, "error":null};
                    io.to(connectionId.socket).emit('[naratifla] N5 list', retObj);   
                }
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock N01: " + ex);
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
                jtool.errorLog(" [Error] Sock S01: " + ex);
            }
        });

        socket.on('[susie] lens list', function (info) {
            try {
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) {
                    var retObj = {"sID":info.sID, "data": null };

                    var labelsFile = configLoc+"/config/data/imgModels/coco.names";
                    var lensData = fs.readFileSync(labelsFile).toString().replace(/(\r\n|\n|\r)/gm,"=").split("=");

                    retObj.data = (lensData ? lensData : null);                                        
                    io.to(connectionId.socket).emit('[susie] lens list', retObj);
                }
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock S02: " + ex);
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
                jtool.errorLog(" [Error] Sock F01: " + ex);
            }
        });

        /* Little Bill */
        socket.on('[lil bill] sys info', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) { 
                    var retObj = {"sID":info.sID, "data":info.data };
                    io.to(connectionId.socket).emit('[lil bill] sys info', retObj);
                }
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock LB01: " + ex);
            }
        });

        /* Penny Proud */
        socket.on('[penny proud] dir tree', function (info) {
            try {
                /* TODO: AUTHENTICATE USER */
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) { 
                    var retObj = {"sID":info.sID, "data":info.data };
                    io.to(connectionId.socket).emit('[penny proud] dir tree', retObj);
                }
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock LB01: " + ex);
            }
        });

        ss(socket).on('[penny proud] retrieve file', function(stream, info) { 
            try {
                filestore.streamFileData(info, stream, function(ret){
                    jtool.errorLog(" [Debug] File is completed: "+ ret.path);
                    var connectionId = connections.getConnection(info.rID);

                    if (connectionId && connectionId.socket) { 
                        var retObj = {"sID":info.sID, "data":ret.filename};
                        io.to(connectionId.socket).emit('[penny proud] retrieve file', retObj);
                    }
                });
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock PP01: " + ex);
            }   
        });

        socket.on('[penny proud] no file', function (info) {
            try {
                jtool.errorLog(" [Error] No File "); jtool.errorLog(info);
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) { 
                    var retObj = { "sID":info.sID, "data":null, "error":info.error };
                    io.to(connectionId.socket).emit('[penny proud] retrieve file', retObj);
                }
            }
            catch(ex){
                jtool.errorLog(" [Error] Sock PP02: " + ex);
            }
        });
    });
}