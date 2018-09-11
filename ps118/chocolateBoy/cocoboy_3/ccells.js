'use strict';

const dirTree = require('directory-tree');

class CCELLS {
    constructor() { }

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
}

module.exports = CCELLS;