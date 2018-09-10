'use strict';

class JConnection {
    constructor() {
        this.connectionList = {};
    }
    // Add Connection To List
    addConnection(name, conn) {
        var self = this;
        var status = false;
        try {
            if (name in self.connectionList) {
                self.connectionList[name].connection = conn;
                console.log(name, " updated network connection");
            }
            else {
                self.connectionList[name] = { "connectionId":name, "connection": conn, "nickname": null, "socket": null };
                console.log(name, " joined network");
            }
            status = true;
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Add Socket Id to Object
    addSocket(name, sockId) {
        var self = this;
        var status = false;
        try {
            if (name in self.connectionList) {
                self.connectionList[name].socket = sockId;
                console.log(name, " connected socket");
                status = true;
            }          
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Remove Socket Id from Object
    removeSocket(name) {
        var self = this;
        var status = false;
        try {
            if (name in self.connectionList) {
                self.connectionList[name].socket = null;
                console.log(name, " disconnected socket");
                status = true;
            }
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Remove Connection From List
    removeConnection(name) {
        var self = this;
        var status = false;
        try {
            delete self.connectionList[name];
            console.log(name, " left network");
            status = true;
        }
        catch (ex) {
            status = false;
        }
        return status;
    }

    // Return Connection
    getConnection(name) {
        var self = this;
        var ret = null;

        try {
            ret = (name in self.connectionList ? self.connectionList[name] : null); 
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