'use strict';
const iplocation = require("iplocation").default;

/*
  connectionId
  nickname
  token
  socket
  connection
  location
*/

class JConnection {
    constructor() {
        this.connectionList = {};       
    }
    // Add Connection To List
    addConnection(id, conn, nickname, token) {
        var self = this;
        var status = false;
        try {
            if (id in self.connectionList) {
                self.connectionList[id].connection = conn;
                self.connectionList[id].nickname = nickname;
                self.connectionList[id].token = token;
                console.log(id, " updated network connection");
            }
            else {
                self.connectionList[id] = { "connectionId":id, "connection": conn, "nickname": nickname, "token":token, "socket": null };
                console.log(id, " joined network");
            }
            status = true;
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Remove Connection From List
    removeConnection(id) {
        var self = this;
        var status = false;
        try {
            delete self.connectionList[id];            
            console.log(id, " completely left network");
            status = true;
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Remove Connection From List
    clearConnection(id) {
        var self = this;
        var status = false;
        try {
            self.connectionList[id].connection = null;
            console.log(id, " left network");
            status = true;
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Add Socket Id to Object
    addSocket(id, token, sockId) {
        var self = this;
        var status = false;
        try {
            if (id in self.connectionList) {
                self.connectionList[id].socket = sockId;
                console.log(id, " connected socket");
                status = true;
            }          
        }
        catch (ex) {
            status = false;
            console.log("Error adding socket: ", ex);
        }
        return status;
    }

    // Remove Socket Id from Object
    removeSocket(id) {
        var self = this;
        var status = false;
        try {
            if (id in self.connectionList) {
                self.connectionList[id].socket = null;
                console.log(id, " disconnected socket");
                status = true;
            }
        }
        catch (ex) {
            status = false;
            console.log("Error removing socket: ", ex);
        }
        return status;
    }

    // Return Connection
    getConnection(id) {
        var self = this;
        var ret = null;

        try {
            ret = (id in self.connectionList ? self.connectionList[id] : null); 
        }
        catch (ex) {
            ret = null;
            console.log("Error getting connection: ", ex);
        }
        return ret;
    }

    updateIPLocation(id, ip){
        var self = this;        

        try {
            /*_getIpLocation(ip, function(res){
                if(res.error){
                    console.log("Error updating IP Location [", id,"](2):", res.error);                    
                }
                else {                    
                    if(!(id in self.connectionList)) {
                        console.log("Error updating IP Location [", id,"](2): No Id Found In Connection List");
                    }
                    else {
                        self.connectionList[id].location = res.ret;
                        //console.log(" [DEBUG]: ", res.ret);
                    }
                }
            });*/
        }
        catch (ex) {
            console.log("Error updating IP Location [", id, "]:", ex);
        }        
    }

    // Return all connections
    getAll() {
        var self = this;
        var ret = null;

        try {
            ret = Object.values(self.connectionList);
        }
        catch (ex) {
            console.log("Error getting all connections: ", ex);
            ret = null;
        }
        return ret;
    }
}

module.exports = JConnection;

/* Get Location from IP */
function _getIpLocation(ip, callback){
    try {
        if(!ip){
            callback({"error":"No a Valid IP", "ret":null});
        }
        else {
            iplocation(ip, [], (error, res) => {  
                if(error){
                    callback({"error":error, "ret":null});
                }
                else {
                    callback({"error":null, "ret":res});
                }
            });
        }
    }
    catch(ex){
        console.log("IP Loc Error: ", ex);
        callback({"error":ex, "ret":null});
    }
}