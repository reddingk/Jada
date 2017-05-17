// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('phoebe', {
   bindings: {},
	 controller: function (jInfo) {
      // Login Check
      if(jInfo.check.jlogin()){
        var userId = jInfo.user.get.userId();

        var ctrl = this;
  		  ctrl.title = "Phoebe";

        ctrl.welcome = "Welcome " + userId;

        var socket = jInfo.socket.get();
        if(socket == null){
          socket = io('http://localhost:1003', { query: "userid="+userId });
          jInfo.socket.set(socket);
        }

        var canvas = document.getElementById('canvas-video');
        var context = canvas.getContext('2d');
        var img = new Image();

        // show loading notice
        context.fillStyle = '#333';
        context.fillText('Loading...', canvas.width/2-30, canvas.height/3);

        socket.on('frame', function (data) {
          var uint8Arr = new Uint8Array(data.buffer);
          var str = String.fromCharCode.apply(null, uint8Arr);
          var base64String = btoa(str);

          img.onload = function () {
            context.drawImage(this, 0, 0, canvas.width, canvas.height);
          };
          img.src = 'data:image/png;base64,' + base64String;
        });
      }
   },
   templateUrl: 'views/ps118/phoebe.html'
});
