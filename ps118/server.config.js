
module.exports = function(io){

  // socket connection
  io.on('connection', function(socket){
  	var userId = socket.handshake.query.userid;
    console.log(userId + ' connected on socket: ' + socket.id);
    // add socket to list

  	// general message
  	socket.on('general', function(msg){
      //console.log(msg);
  		io.emit('general', msg);
    });

  	// socket disconnection
  	socket.on('disconnect', function(){
      console.log(userId + ' disconnected: ' + socket.id);
      // remove socket from list
    });

  	// private message
  	socket.on('private message',function(info){
  		//console.log(info);
  		io.to(info.privateId).emit('private message', info.info);
  	});

  	/* CHAT ROOMS */
  	// join room
  	socket.on('join room',function(info){
  		console.log(info.info.userId + " is joining room " + info.roomId)
  		socket.join(info.roomId);
  	});

  	// leave room
  	socket.on('leave room',function(info){
  		console.log(info.info.userId + " is leaving room " + info.roomId);
  		socket.leave(info.roomId);
  	});

  	// room message
  	socket.on('room message',function(info){
  		//console.log(info);
  		io.to(info.roomId).emit('room message', info.info);
  	});

    /* CHOCOLATE NETWORK */

    // chocolate network join
    socket.on('chocolate network',function(info){
  		console.log(info.info.id + " is joining room chocolate network");
  		socket.join("cocoNetwork");
  	});
    // chocolate list
    socket.on('chocolate list',function(info){
  		console.log("getting list of connected users");
      var cocoClients = io.sockets.adapter.rooms["cocoNetwork"];

  		io.to("cocoNetwork").emit('chocolate list', {"room-sockets":cocoClients, "msg":"received list of connected"});
  	});
    // blast to all Chocolate Boys
    socket.on('chocolate blast',function(info){
  		//console.log(info);
  		io.to("cocoNetwork").emit('chocolate blast', info.info);
  	});
    // chocolate command
  	socket.on('chocolate command',function(info){
  		//console.log(info);
  		io.to(info.id).emit('chocolate command', info.info);
  	});

  });

}
