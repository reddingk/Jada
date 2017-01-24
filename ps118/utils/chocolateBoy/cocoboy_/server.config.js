module.exports = function(io){
  var id = "TestCB";
  var socket = io.connect('http://localhost:1003', { query: "userid="+id });
  var brain = require('./cbrain');

  // join chocolate network
  socket.emit('chocolate network', {"info":{"id":id} } );

  // connected correct
  socket.on('connect', function(){
    // send id with Socket ID
    console.log("connected to chocolate network");
  });
  // socket disconnection
  socket.on('disconnect', function(){
    console.log('disconnected from server');
  });
  // chocolate list
  socket.on('chocolate list',function(info){
  	console.log(" > chocolate list");
  });

  // chocolate command
  socket.on('chocolate command',function(info){
  	console.log(info);
  });

  // chocolate blast
  socket.on('chocolate blast',function(info){
    console.log(info);
    if(info.ctrl == true){
      brain.parseAction(info.msg, function(res){
        socket.emit('chocolate blast', { "info":{"userId":id ,"response":res} } );
      });
    }
  });
}
