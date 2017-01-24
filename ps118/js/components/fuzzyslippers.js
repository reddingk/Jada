// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('fuzzyslippers', {
   bindings: {},
	controller: function ($scope, jInfo) {
      // Login Check
      if(jInfo.check.jlogin()){
        var userId = jInfo.user.get.userId();

        var ctrl = this;

        var socket = jInfo.socket.get();
        if(socket == null){
          socket = io('http://localhost:1003', { query: "userid="+userId });
          jInfo.socket.set(socket);
        }

  		  ctrl.title = "Fuzzy Slippers";
        ctrl.welcome = "Hey " + userId;

        ctrl.cocoMsg = "";
        ctrl.messages = [{"time": (new Date()).getTime() , "info":{"msg":"COCO DEFAULT MSG"} }];

        // connect to network
        socket.emit('chocolate network', {"info":{"id":userId} } );

        ctrl.sendMsg = function() {
          var d = new Date();
          socket.emit('chocolate blast', { "info":{"userId":userId , "ctrl":true, "msg":ctrl.cocoMsg} } );
          ctrl.messages.push({"time": d.getTime(), "info":{"userId":ctrl.userId ,"msg":ctrl.userRoomMsg} });
          ctrl.cocoMsg = "";
        }

        ctrl.listCoco = function() {
          var d = new Date();
          socket.emit('chocolate list', { "info":{"userId":userId} } );
          ctrl.messages.push({"time": d.getTime(), "info":{"userId":ctrl.userId ,"msg":"list connections"} });
          ctrl.cocoMsg = "";
        }

        // socket blast messages
        socket.on('chocolate blast', function(msg){
          var d = new Date();
          ctrl.messages.push({"time": d.getTime(), "info":msg});
          $scope.$apply();
        });

        // socket coco list
        socket.on('chocolate list', function(msg){
          var d = new Date();
          ctrl.messages.push({"time": d.getTime(), "info":msg});
          $scope.$apply();
        });
      }
   },
   templateUrl: 'views/ps118/fuzzyslippers.html'
});
