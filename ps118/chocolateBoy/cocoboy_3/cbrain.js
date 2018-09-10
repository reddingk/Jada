'use strict';
const NERVES = require('./cnerves.js');

class CBRAIN {
    constructor() {
        this.cnerves = new NERVES();
    }

    runCommand(command, data, callback) {
        try {

        }
        catch (ex) {
            var errMsg = "error running cmd: " + ex;
            console.log(errMsg);
            callback({ "error": errMsg });
        }
    }
}

module.exports = CBRAIN;