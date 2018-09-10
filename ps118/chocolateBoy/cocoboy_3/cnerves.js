'use strict';

const CELLS = require('./ccells.js');

class CNERVES {
    constructor() {
        this.ccells = new CELLS();
    }

    /* broadcast Message */
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

    /* Get Directory Tree */
    directoryTree(data, callback) {
        var self = this;
        try {

        }
        catch (ex) {

        }
    }
}

module.export = CNERVES;