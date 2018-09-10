var express = require('express');
var router = express.Router();
let sseExpress = require('sse-express');

// Network Services
var sse = require('../services/sse.service');

module.exports = function (connections) {
    // Connect to J Network
    router.get('/connect/:id', sseExpress(), function (req, res) {
        sse.connect(req, res, connections);
    });

    /* Auth Required */
    
    // Broadcast Message to Network
    router.post('/broadcast', function (req, res) {
        sse.broadcast(req, res, connections);
    });

    // Get Connection List 
    router.post('/getConnections', function (req, res) {
        sse.getConnections(req, res, connections);
    });

    return router;
}