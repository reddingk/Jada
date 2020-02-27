'use strict';

const Nerves = require('./fnerves.js');
const io = require('socket.io-client');
const cfg = require('../config.json');

class FBRAIN {
    constructor(name) {
        this.fnerves = new Nerves(name);
        this.name = name;
        this.socket = null;
    }
    
    /* broadcast message */
    broadcast(data, callback){
        var results = {"status":null};

        try {
            console.log(data);
            results.status = "compete";
        }
        catch(ex){
            console.log(" [ERROR] broadcasting: ",ex);
        }
        callback(results);
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
                        _declareSocket(self.socket, self.cnerves);
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
            results.status = "Error attempting to " + data.status + " Socket: " + ex;
            console.log(result.status);
        }
        callback(results);
    }
}

module.exports = FBRAIN;

/* Private Functions */
/* Run Command */
function _runCommand(fNerves, command, data, socket, callback) {
    try {
        if(!(command in fNerves)){
           callback({"error": "Command is missing:"});
        }
        else {
            fNerves.socket = socket;
            fNerves[command](data, callback);
        }
    }
    catch (ex) {
        var errMsg = "error running cmd: " + ex;
        console.log(errMsg);
        callback({ "error": errMsg });
    }
}

/* Declare / setup Socket */
function _declareSocket(socket, fNerves){
    
    socket.on('connect', function(){
        console.log("connected sock to jnetwork");
    });

    socket.on('flick connection', function(data){        
        if(!data.command) {
            socket.emit('flick connection', {"sID":data.rID, "data":{"error":"no command"}});
        }
        else {
            _runCommand(fNerves, data.command, data, socket, function(res){                
                socket.emit('flick connection', res);
            });
        }
    });

    socket.on('disconnect', function(){
        console.log('disconnected from jnetwork');
    });
}