
// server info
var os = require('os');
var mongoose = require('mongoose');
var database = require('./dbcfg');

// Video Functions
var brain = require('./pbrain');

mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrlClean, {user:database.uname, pass:database.pwd});

var phoebeConnects = mongoose.model('connects', { name: {type: String, default: ''},  loc: {type: String, default: undefined} });

module.exports = function(io){
  phoebeConnects.find(function(err, tmpLoc){
    srcLoc = tmpLoc[0].loc;
    var id = "PH-" + os.hostname();

    var socket = io.connect(srcLoc, { query: "userid="+id });
    socket.emit('phoebes house', {"info":{"id":id} } );

    // Functions
    // connected correct
    socket.on('connect', function(){      
      console.log("connected to phoebe's house");
    });

    socket.on('stop', function(info){
      console.log('Stop Video: ' + info.type);
      brain.stopStream(info.type);
    });

    socket.on('liveStream', function(){
      console.log('Live Stream Video');
      brain.liveStream(socket);
    });  

    socket.on('faceDetect', function(){
      console.log('Face Detect PH');
      brain.faceDetect(socket);
    });  

    socket.on('motionTracker', function(){
      console.log('Motion Tracker PH');
      brain.motionTracker(socket);
    });  

    socket.on('multiColorTrack', function(info){
      console.log('Track Color');
      brain.multiColorTrack(socket, info.minColor, info.maxColor);
    });
    
    socket.on('echo Test', function(info){
      console.log('PHeobe Echo Test');      
    });
    
  });
}