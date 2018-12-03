'use strict';

const Cells = require('./ccells.js');

class CNERVES {
    constructor(id) {
        this.name = id;
        this.ccells = new Cells();
        this.socket = null;
    }

    /* broadcast message */
    broadcast(data, callback) {
        var self = this;
        try {
            console.log(data);
        }
        catch (ex) {
            console.log("Error bradcasting data: ", ex);
        }
        callback({ "status": true });
    }

    
    /* Directory Tree */
    directoryTree(data, callback){
        var self = this;
        var ret = {"sID":null, "data": { "rID":null, "command":null, "data":null, "error":null}};

        try {
            ret.command = "directoryTree";
            ret.sID = data.rID;
            ret.data.rID = self.name;

            if(data.loc){
                self.ccells.directoryTree(data.loc, function(res){
                    ret.data.data = res;
                    callback(ret);
                });
            }
            else {                
                ret.error = "no loc for tree";
                callback(ret);
            }
        }
        catch(ex){
            ret.error = "error getting tree" + ex;
            callback(ret);
        }
    }

    /* Vid View */
    pheobeView(data, callback){
        var self = this;
        var ret = { "sID":null, "data":{"rID":null, "command":null, "filter":null, "filterStatus":false, "data":null, "error":null}};

        //console.log(" [DEBUG]: Pheobe-View :", data.userId);
        try {
            
            ret.sID = data.rID;
            /*data*/
            ret.data.rID = self.name;
            ret.data.command = "pheobeView";
            ret.data.filter = data.filter;
            ret.data.filterStatus = true;
 
            self.ccells.phoebeView(function(pRet){
                if(pRet.error){ ret.data.error = pRet.error; }
                else { ret.data.data = pRet.data; }
                        
                callback(ret);
            });
        }
        catch(ex){
            ret.data.error = "error getting view [2]" + ex;
            callback(ret);
        }
    }
}

module.exports = CNERVES;
