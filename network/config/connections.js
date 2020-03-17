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
            "ktest":{"connection":null, "nickname":"Test Man", "token":"J6968MjfCFaeMHMt8kDAA1"}
        };       
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
                jtool.errorLog(" [CONNECTION] " + id + " updated network connection");
            }
            else {
                self.connectionList[id] = { "connectionId":id, "connection": conn, "nickname": nickname, "token":token, "socket": null };
                jtool.errorLog(" [CONNECTION] " + id + " joined network");
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
            jtool.errorLog(" [CONNECTION] " + id + " completely left network");
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
            jtool.errorLog(" [CONNECTION] " + id + " left network");
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
            ret = (id in self.connectionList ? self.connectionList[id] : null); 
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
        var self = this;
        var ret = null;

        try {
            ret = Object.values(self.connectionList);
        }
        catch (ex) {
            jtool.errorLog(" [ERROR] getting all connections: " + ex);
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