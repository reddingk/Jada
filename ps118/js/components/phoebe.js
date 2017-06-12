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

        socket.emit('phoebes house', {"info":{"id":userId} } );

        var canvas = document.getElementById('canvas-video');
        var context = canvas.getContext('2d');
        var img = new Image();

        // show loading notice
        context.fillStyle = '#333';
        context.fillText('Loading...', canvas.width/2-30, canvas.height/3);

        socket.on('PHframe', function (data) {
          console.log("Get Some Data");
          var uint8Arr = new Uint8Array(data.buffer);
          var str = String.fromCharCode.apply(null, uint8Arr);
          var base64String = btoa(str);

          img.onload = function () {
            context.drawImage(this, 0, 0, canvas.width, canvas.height);
          };
          img.src = 'data:image/png;base64,' + base64String;
        });

        ctrl.vidType = "NONE";
        ctrl.sId = "";
        // video controls
        ctrl.live = function(){
          socket.emit('liveStream', { 'id':ctrl.sId } );
          ctrl.vidType = "LIVE";
        }

        ctrl.face = function(){
          socket.emit('faceDetect', {'id':ctrl.sId } );
          ctrl.vidType = "FACE";
        }
        ctrl.motion = function(){
          socket.emit('motionTracker', { 'id':ctrl.sId } );
          ctrl.vidType = "MOTION";
        }
        ctrl.color = function(){
          socket.emit('multiColorTrack', {'id':ctrl.sId, 'colors':{'minColor':[255,0,0], 'maxColor':[255, 149, 95]}}  );
          ctrl.vidType = "COLOR";
        }
        ctrl.stop = function(){
          socket.emit('stop', { 'id':ctrl.sId } );
          // show loading notice                   
          context.fill();

          ctrl.vidType = "NONE";
        }
        ctrl.echo = function(){
          socket.emit('echo Test', { 'id':ctrl.sId } );
          ctrl.vidType = "NONE";
        }
      }
   },
   templateUrl: 'views/ps118/phoebe.html'
});
