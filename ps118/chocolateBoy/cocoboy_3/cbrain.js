'use strict';

const Nerves = require('./cnerves.js');
var io = require('socket.io-client');
var cfg = require('../config/config.json');

class CBRAIN {
    constructor(name) {
        this.cnerves = new Nerves();
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
                        self.socket = io.connect(cfg.sockUrl, { query: "userid="+ self.name });
                        declareSocket(self.socket);
                        break;
                    case 'close':
                        self.socket.close();
                        break;
                    default:
                        break;
                }

                result.status = "compete";
            }
        }
        catch(ex){
            results.status = "Error " + data.status + "ing Socket: " + ex;
        }
        callback(result);
    }
}

module.exports = CBRAIN;

/* Private Functions */
/* Run Command */
function runCommand(command, data, callback) {
    var self = this;
    try {
        if(!(command in self.cnerves)){
           callback({"error": "Command is missing:"});
        }
        else {
            self.cnerves[command](data, callback);
        }
    }
    catch (ex) {
        var errMsg = "error running cmd: " + ex;
        console.log(errMsg);
        callback({ "error": errMsg });
    }
}

/* Declare / setup Socket */
function declareSocket(socket){
    
    socket.on('connect', function(){
        console.log("connected to jnetwork");
    });

    socket.on('direct connect', function(data){
        if(!data.command) {
            socket.to(data.id).emit('direct connect', {"error":"no command"});
        }
        else {
            runCommand(data.command, data.data, function(res){
                socket.to(data.id).emit('direct connect', res);
            });
        }
    });

    socket.on('disconnect', function(){
        console.log('disconnected from jnetwork');
    });
}