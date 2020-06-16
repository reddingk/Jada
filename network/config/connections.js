'use strict';
const iplocation = require("iplocation").default;
const Tool = require('../../jada_3/jtools.js');
const jtool = new Tool();

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
        this.connectionList = {
            "kredding":{ "connectionId":"kredding", "connection": null, "nickname": "Kris", "token":"2813308004", "socket": null }
        };  
        this.subConnectionList = {
            "#5-Test1":{ "connectionId":"#5-Test1", "connection": null, "nickname": "#5-Test1", "token":"2813308004", "socket": null },
            "#5-Test2":{ "connectionId":"#5-Test2", "connection": null, "nickname": "#5-Test2", "token":"2813308004", "socket": null },
            "#5-Test3":{ "connectionId":"#5-Test3", "connection": null, "nickname": "#5-Test3", "token":"2813308004", "socket": null },
            "#5-Test4":{ "connectionId":"#5-Test4", "connection": null, "nickname": "#5-Test4", "token":"2813308004", "socket": null },
            "#5-Test5":{ "connectionId":"#5-Test5", "connection": null, "nickname": "#5-Test5", "token":"2813308004", "socket": null }
        };     
    }
    // Add Connection To List
    addConnection(id, conn, nickname, token, isSub) {
        var self = this;
        var status = false;
        try {
            if (id in self.connectionList) {
                self.connectionList[id].connection = conn;
                self.connectionList[id].nickname = (nickname == null? id : nickname);
                self.connectionList[id].token = token;
                jtool.errorLog(" [CONNECTION] " + id + " updated network connection");
            }
            else if (id in self.subConnectionList) {
                self.subConnectionList[id].connection = conn;
                self.subConnectionList[id].nickname = (nickname == null? id : nickname);
                self.subConnectionList[id].token = token;
                jtool.errorLog(" [CONNECTION] " + id + " updated sub network connection");
            }
            else {
                if(isSub) {
                    self.subConnectionList[id] = { "connectionId":id, "connection": conn, "nickname": nickname, "token":token, "socket": null };
                }
                else {
                    self.connectionList[id] = { "connectionId":id, "connection": conn, "nickname": nickname, "token":token, "socket": null };
                }
                jtool.errorLog(" [CONNECTION] " + id + (isSub ? " joined sub network": " joined network"));
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
            if(id in self.subConnectionList) {
                delete self.subConnectionList[id]; 
                jtool.errorLog(" [CONNECTION] " + id + " completely left sub network");
            }
            else {
                delete self.connectionList[id]; 
                jtool.errorLog(" [CONNECTION] " + id + " completely left network");
            }
           
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
            if(id in self.subConnectionList) {
                self.subConnectionList[id].connection = null; 
                jtool.errorLog(" [CONNECTION] " + id + " left sub network");
            }
            else {
                self.connectionList[id].connection = null;
                jtool.errorLog(" [CONNECTION] " + id + " left network");
            }

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
            if(!id || id == "null"){
                jtool.errorLog(" [CONNECTION] no connection ID");
            }
            else if (id in self.connectionList) {
                self.connectionList[id].socket = sockId;
                jtool.errorLog(" [CONNECTION] " + id + " connected socket");
                status = true;
            }
            else if (id in self.subConnectionList) {
                self.subConnectionList[id].socket = sockId;
                jtool.errorLog(" [CONNECTION] " + id + " sub connected socket");
                status = true;
            }
            else {
                jtool.errorLog(" [CONNECTION] " + id + " is not in list please reconnect");
                status = false;
            }          
        }
        catch (ex) {
            status = false;
            jtool.errorLog(" [ERROR] Adding socket: " + ex);
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
                jtool.errorLog(" [CONNECTION] " + id + " disconnected socket");
                status = true;
            }
            else if (id in self.subConnectionList) {
                self.subConnectionList[id].socket = null;
                jtool.errorLog(" [CONNECTION] " + id + " sub disconnected socket");
                status = true;
            }
        }
        catch (ex) {
            status = false;
            jtool.errorLog(" [ERROR] removing socket: " + ex);
        }
        return status;
    }

    // Return Connection
    getConnection(id) {
        var self = this;
        var ret = null;

        try {
            if (id in self.connectionList) { ret = self.connectionList[id]; }
            else if (id in self.subConnectionList) { ret = self.subConnectionList[id]; }
            else { ret = null; }
        }
        catch (ex) {
            ret = null;
            jtool.errorLog(" [ERROR] getting connection: " + ex);
        }
        return ret;
    }

    updateIPLocation(id, ip){
        var self = this;        

        try {
            /*_getIpLocation(ip, function(res){
                if(res.error){
                    jtool.errorLog(" [ERROR] updating IP Location [", id,"](2):", res.error);                    
                }
                else {                    
                    if(!(id in self.connectionList)) {
                        jtool.errorLog(" [ERROR] updating IP Location [", id,"](2): No Id Found In Connection List");
                    }
                    else {
                        self.connectionList[id].location = res.ret;
                        //jtool.errorLog(" [DEBUG] " + res.ret);
                    }
                }
            });*/
        }
        catch (ex) {
            jtool.errorLog(" [ERROR] updating IP Location [" + id + "]:" + ex);
        }        
    }

    // Return all connections
    getAll() {
        var ret = null;

        try {
            ret = Object.values(this.connectionList);
        }
        catch (ex) {
            jtool.errorLog(" [ERROR] getting all connections: " + ex);
            ret = null;
        }
        return ret;
    }

    getSubConnections(){
        var ret = null;
        try {
            ret = Object.values(this.subConnectionList);
        }
        catch (ex) {
            jtool.errorLog(" [ERROR] getting sub connections: " + ex);
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
        jtool.errorLog(" [ERROR] IP Loc: " + ex);
        callback({"error":ex, "ret":null});
    }
}