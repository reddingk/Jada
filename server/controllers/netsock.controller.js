const fs = require('fs');
const log = require('../services/log.service');
const dbauth = require('../services/auth.service');
const dataFilter = require('../services/dataFilter.service');
const configLoc = (process.env.CONFIG_LOC ? process.env.CONFIG_LOC : "/jada/localConfig");

module.exports = function (io, connections) {
    // socket connection
    io.on('connection', function (socket) {
        var userId = socket.handshake.query.userId;
        var userToken = socket.handshake.query.token;
        //var ipAddress = socket.handshake.address;

        dbauth.authenticateJWTUser(userToken, function(ret){
            if(ret.error){
                log.error("Authenticating Users: " + ret.error); socket.disconnect(true);
            }
            else if(!ret.status){
                log.info("User Not Valid "); socket.disconnect(true);
            }
            else {
                socketDecleration(io, socket, connections, ret.results);
            }
        });             
    });
}

/* Internal Functions */
function socketDecleration(io, socket, connections, user){
    try {
        // Create Connection Item
        connections.addConnection(user.userId, null, user.name, null, false);
        // add socket to connection item
        var connStatus = connections.addSocket(user.userId, socket.id);
        
        if(!user.userId && !connStatus) {
            // Disconnect user
            connections.removeSocket(user.userId);
            if(socket.id){
                io.to(socket.id).emit('disable_connection', {"status":false});
                socket.disconnect(true);
            }
        }  

        // socket disconnect
        socket.on('disconnect', function () {
            connections.removeSocket(user.userId);
        });

        /* Susie */
        socket.on('[susie] view', function (info) {
            try {
                var connectionId = connections.getConnection(info.rID);

                if (connectionId && connectionId.socket) { 
                    dataFilter.filterCheck(info.data, function(ret){  
                        var retObj = {...ret, "sID":info.sID, "filter":info.data.filter};                        
                        io.to(connectionId.socket).emit('[susie] view', retObj);
                    });               
                }
                else {
                    log.warning("[T1] No Conn");
                }
            }
            catch(ex){
                log.error("Sock Issue S01: " + ex);
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
                log.error("Sock Issue S02: " + ex);
            }
        });
    }
    catch(ex){
        log.error("Socket Decleration: " + ex);
    }
}