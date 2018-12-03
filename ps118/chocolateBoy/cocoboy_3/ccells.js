'use strict';

const fs = require('fs');
const dirTree = require('directory-tree');
const NodeWebcam = require( "node-webcam" );
const cv = require("opencv4nodejs");

class CCELLS {
    constructor() { 
        this.intvl = null;
        this.peyes = new cv.VideoCapture(0);
        /*NodeWebcam.create({
            callbackReturn: "base64",
            saveShots: false
        });*/
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
            /*self.peyes.clear();
            self.peyes.capture("phoebe_view", function(err, pRet){
                if(err){ ret.error = err; console.log("Error capture: ", ret.error);}
                else { ret.data = pRet; }

                callback(ret);
            });*/

            var matImg = self.peyes.read();

            if (matImg.empty) {
                self.peyes.reset();
                matImg = self.peyes.read();
            }

            ret.data = cv.imencode('.jpg', matImg);
            callback(ret);
        }
        catch(ex){
            ret.error = "error getting view" + ex;
            console.log("Error catch: ", ret.error);
            callback(ret);
        }
    }

}

module.exports = CCELLS;