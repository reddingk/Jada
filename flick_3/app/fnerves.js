'use strict';

const Cells = require('./fcells.js');

class FNERVES {
    constructor(id) {
        this.name = id;
        this.ccells = new Cells();
        this.socket = null;
    }

    /* broadcast message */
    broadcast(data, callback) {        
        try {
            console.log(data);
        }
        catch (ex) {
            console.log(" ERROR] bradcasting data: ", ex);
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
                self.fcells.directoryTree(data.loc, function(res){
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


}

module.exports = FNERVES;