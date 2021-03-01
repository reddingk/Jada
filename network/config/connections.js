'use strict';
const iplocation = require("iplocation").default;
const publicIp = require('public-ip');
const Tool = require('../../jada_3/jtools.js');
const jtool = new Tool();
const log = require("../../services/log.service");

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
        this.subConnectionList = {};     
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
                log.info(" [CONNECTION] " + id + " updated network connection");
            }
            else if (id in self.subConnectionList) {
                self.subConnectionList[id].connection = conn;
                self.subConnectionList[id].nickname = (nickname == null? id : nickname);
                self.subConnectionList[id].token = token;
                log.info(" [CONNECTION] " + id + " updated sub network connection");
            }
            else {
                if(isSub) {
                    self.subConnectionList[id] = { "connectionId":id, "connection": conn, "nickname": (nickname == null? id : nickname), "token":token, "socket": null };
                }
                else {
                    self.connectionList[id] = { "connectionId":id, "connection": conn, "nickname": (nickname == null? id : nickname), "token":token, "socket": null };
                }
                log.info(" [CONNECTION] " + id + (isSub ? " joined sub network": " joined network"));
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
                log.info(" [CONNECTION] " + id + " completely left sub network");
            }
            else {
                delete self.connectionList[id]; 
                log.info(" [CONNECTION] " + id + " completely left network");
            }
           
            status = true;
        }
        catch (ex) {
            log.error("Removing Connection [" + id + "]:" + ex);
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
                log.info(" [CONNECTION] " + id + " left sub network");
            }
            else {
                self.connectionList[id].connection = null;
                log.info(" [CONNECTION] " + id + " left network");
            }

            status = true;
        }
        catch (ex) {
            status = false;
            log.error("Clearing Connection [" + id + "]:" + ex);
        }
        return status;
    }

    // Add Socket Id to Object
    addSocket(id, sockId) {
        var self = this;
        var status = false;
        try {
            if(!id || id == "null"){
                log.error(" [CONNECTION] no connection ID");
            }
            else if (id in self.connectionList) {
                self.connectionList[id].socket = sockId;
                log.info(" [CONNECTION] " + id + " connected socket");
                status = true;
            }
            else if (id in self.subConnectionList) {
                self.subConnectionList[id].socket = sockId;
                log.info(" [CONNECTION] " + id + " sub connected socket");
                status = true;
            }
            else {
                log.warning(" [CONNECTION] " + id + " is not in list please reconnect");
                status = false;
            }          
        }
        catch (ex) {
            status = false;
            log.error("Adding socket: " + ex);
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
                log.info(" [CONNECTION] " + id + " disconnected socket");
                status = true;
            }
            else if (id in self.subConnectionList) {
                self.subConnectionList[id].socket = null;
                log.info(" [CONNECTION] " + id + " sub disconnected socket");
                status = true;
            }
        }
        catch (ex) {
            status = false;
            log.error(" [ERROR] removing socket: " + ex);
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
            log.error("Getting connection: " + ex);
        }
        return ret;
    }

    updateIPLocation(id, ip){
        var self = this;        

        try {
            _getIpLocation(ip, function(res){
                if(res.error){
                    log.error("Updating IP Location [" + id + "](2):", res.error);                    
                }
                else if(id.startsWith("access-")){
                    log.info("[CONNECTION] Access Connection");
                }
                else if (id in self.connectionList) { 
                    self.connectionList[id].location = res.ret;
                    log.info("[CONNECTION] Updated Loc: " + id);
                }
                else if (id in self.subConnectionList) {
                    self.subConnectionList[id].location = res.ret;
                    log.info("[CONNECTION] Updated Sub Loc: " + id);
                }
                else {   
                    log.error("Updating IP Location [" + id + "](3): No Id Found In Connection List");
                }
            });
        }
        catch (ex) {
            log.error("Updating IP Location [" + id + "]:" + ex);
        }        
    }

    // Return all connections
    getAll() {
        var ret = null;

        try {
            ret = Object.values(this.connectionList);
        }
        catch (ex) {
            log.error("Getting all connections: " + ex);
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
            log.error("Getting sub connections: " + ex);
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
        else if(ip.indexOf("::1") >= 0 || ip.indexOf(":127.0.0.1") >= 0) {
            (async () => {
                var tmpIP = await publicIp.v4();
                
                iplocation(tmpIP, [], (error, res) => {  
                    if(error){
                        callback({"error":error, "ret":null});
                    }
                    else {
                        callback({"error":null, "ret":res});
                    }
                });
            })();
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
        log.error("IP Loc: " + ex);
        callback({"error":ex, "ret":null});
    }
}