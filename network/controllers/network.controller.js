var express = require('express');
var router = express.Router();
//let sseExpress = require('sse-express');
let sseExpress = require('../services/sseDriver.service');

// Network Services
var sse = require('../services/sse.service');

// Auth Services
//var jauth = require('../../security/services/auth.service');

const Tool = require('../../jada_3/jtools.js');
const jtool = new Tool();

module.exports = function (connections) {
    // Connect to J Network
    router.get('/connect/:id', sseExpress({handShakeInterval: 30000}), function (req, res) {
        try {
            res.on('error', err => jtool.errorLog(" [Error] Server Response Error: ","err"));
            sse.connect(req, res, connections);
        }
        catch(ex){
            jtool.errorLog(" [Error] connectiong to jnetwork: " + ex);
        }
    });

    /* Auth Required */
    
    // Broadcast Message to Network
    router.post('/broadcast', function (req, res) {
        /* {userId, token, id, castMsg: {command, data}}*/
        sse.broadcast(req, res, connections);
    });

    // Get Connection List 
    router.post('/getConnections', function (req, res) {
        sse.getConnections(req, res, connections);
    });
    
    return router;
}