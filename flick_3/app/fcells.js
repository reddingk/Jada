'use strict';

const fs = require('fs');
const dirTree = require('directory-tree');

class FCELLS {
    constructor() { 
        this.intvl = null;      
    }

    /* dir tree */
    directoryTree(loc, callback){       
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

module.exports = FCELLS;