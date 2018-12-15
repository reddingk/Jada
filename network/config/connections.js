'use strict';

/*
  connectionId
  nickname
  token
  socket
  connection
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
        }
        return ret;
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