var express = require('express');
var router = express.Router();
let sseExpress = require('sse-express');

// Network Services
var sse = require('../services/sse.service');

// Auth Services
var jauth = require('../../security/services/auth.service');

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

    // Add User to Network
    router.post('/addUser', function(req, res){
        jauth.validateUser(req.body.userId, req.body.token, connections, function(ret){
            if(ret.statusCode > 0){
                jauth.createUser(req.body.user, req.body.userSettings,function(userRet){
                    res.status(200).json({ "data": userRet });
                });
            }
            else {
                res.status(400).json({ "data": null, "statusCode":ret.statusCode, "error":ret.error });
            }
        });
    });
    
    return router;
}