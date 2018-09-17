'use strict';


const CELLS = require('./ccells.js');

class CNERVES {
    constructor() {
        this.ccells = new CELLS();
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
        var ret = { "id":null, "command":null, "data":null, "error":null};

        try {
            ret.command = "directoryTree";
            ret.id = data.id;

            if(data.loc){
                self.ccells.directoryTree(data.loc, function(res){
                    ret.data = res;
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
    phoebeView(data, callback){
        var self = this;
        var ret = { "id":null, "command":null, "filter":null, "filterStatus":false, "data":null, "error":null};

        try {
            ret.command = "phoebeView";
            ret.id = data.id;
            ret.filter = data.filter;
            ret.filterStatus = true;

            self.ccells.phoebeView(function(pRet){
                if(pRet.error){ ret.error = pRet.error; }
                else { ret.data = pRet.data; }

                callback(ret);
            });
        }
        catch(ex){
            ret.error = "error getting view [2]" + ex;
            callback(ret);
        }
    }
}

module.export = CNERVES;
