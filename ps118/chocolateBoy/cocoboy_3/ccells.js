'use strict';

const dirTree = require('directory-tree');
const NodeWebcam = require( "node-webcam" );

class CCELLS {
    constructor() { 
        this.peyes = NodeWebcam.create({
            callbackReturn: "base64",
            saveShots: false
        });
    }

    /* dir tree */
    directoryTree(loc, callback){
        var self = this;
        try {
            if(loc){
                const tree = dirTree(loc);
                callback({"data":tree});
            }
        }
        catch(ex){
            callback({"error":"error building tree: " + ex});
        }
    }

    /* Vid View */
    phoebeView(callback){
        var self = this;
        var ret = {"error":null, "data":null};

        try {

            self.peyes.capture("phoebe_view", function(err, pRet){
                if(err){ ret.error = err; }
                else { ret.data = pRet; }

                callback(ret);
            });
        }
        catch(ex){
            ret.error = "error getting view" + ex;
            callback(ret);
        }
    }
}

module.exports = CCELLS;