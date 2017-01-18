
components.component('harvey', {
   bindings: {},
	controller: function ($scope) {
      var ctrl = this;
      var socket = io('http://localhost:1003');
      //var socket = io();
      var d = new Date();

		  ctrl.title = "Harvey 'The Mailman'";
      ctrl.userMsg = "";
      ctrl.connStatus = "disconnect";
      ctrl.messages = [{"time": d.getTime() , "txt":"DEFAULT MSG"}];

      ctrl.toggleConnection = function(){
        if(ctrl.connStatus == 'connect'){
          socket.connect();
          ctrl.connStatus = "disconnect";
        }
        else {
          socket.disconnect();
          ctrl.connStatus = "connect";
        }
      }
      ctrl.sendMsg = function() {
        socket.emit('tstChat', ctrl.userMsg );
        ctrl.userMsg = "";
      }

      // Add chat if chat message is received
      socket.on('tstChat', function(msg){
        var d = new Date();
        ctrl.messages.push({"time": d.getTime(), "txt":msg});
        $scope.$apply();
      });
      socket.on('connect', function(){
        var d = new Date();
        ctrl.messages.push({"time": d.getTime(), "txt": " > Connected"});
        $scope.$apply();
      });
      socket.on('disconnect', function(){
        var d = new Date();
        ctrl.messages.push({"time": d.getTime(), "txt": " x Disconnected"});
        $scope.$apply();
      });
   },
   templateUrl: 'views/ps118/harvey.html'
});
