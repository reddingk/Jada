'use strict';

const Nerves = require('./cnerves.js');
var io = require('socket.io-client');
var cfg = require('../config/config.json');

class CBRAIN {
    constructor(name) {
        this.cnerves = new Nerves(name);
        this.name = name;
        this.socket = null;
    }

    /* control the status of the socket */
    sockControl(data, callback){
        var self = this;
        var results = {"status":null};

        try {
            if(data){
                switch(data.toLowerCase()){
                    case 'open':
                        /* Check if Connection is Active */
                        self.socket = io.connect(cfg.sockUrl, { query: "userid="+ self.name });
                        declareSocket(self.socket, self.cnerves);
                        break;
                    case 'close':
                        self.socket.close();
                        break;
                    default:
                        break;
                }

                results.status = "compete";
            }
        }
        catch(ex){
            results.status = "Error " + data.status + "ing Socket: " + ex;
            console.log(result.status);
        }
        callback(results);
    }
}

module.exports = CBRAIN;

/* Private Functions */
/* Run Command */
function runCommand(cNerves, command, data, callback) {
    var self = this;
    try {
        if(!(command in cNerves)){
           callback({"error": "Command is missing:"});
        }
        else {
            cNerves[command](data, callback);
        }
    }
    catch (ex) {
        var errMsg = "error running cmd: " + ex;
        console.log(errMsg);
        callback({ "error": errMsg });
    }
}

/* Declare / setup Socket */
function declareSocket(socket, cNerves){
    
    socket.on('connect', function(){
        console.log("connected sock to jnetwork");
    });

    socket.on('direct connection', function(data){
        
        if(!data.command) {
            socket.emit('direct connection', {"error":"no command", "userId":data.userId});
        }
        else {
            runCommand(cNerves, data.command, data, function(res){
                console.log(" [DEBUG]:declare Sock: ", res.userId);
                socket.emit('direct connection', res);
            });
        }
    });

    socket.on('disconnect', function(){
        console.log('disconnected from jnetwork');
    });
}