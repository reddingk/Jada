'use strict';

var routes = angular.module('routes', ['ui.router']);
var directives = angular.module('directives', []);
var components = angular.module('components', ['ui.bootstrap', 'ngAnimate', 'ngSanitize']);
var services = angular.module('services',[]);

var JadenApp = angular.module('JadenApp', ['ngMaterial', 'ngAnimate', 'ui.router', 'directives', 'components',	'services', 'routes']);

services.service('jInfo',['jData', '$filter', '$state', function JadenInfo(jData, $filter, $state){
  var userCache = jData.userInfo;

  return {
    check:{
      jlogin:function(){
        if(jData.userInfo.userId != null) { return true;}
        else { $state.go('app.login'); return false;}
      }
    },
    user: {
      all:function(){
        return userCache;
      },
      get: {
        userId: function(){
          return jData.userInfo.userId;
        }
      },
      set: {
        userId: function(id){
          jData.setUserInfo("userId", id);
        }
      }
    },
    socket: {
      get: function(){
        return jData.userInfo.socket;
      },
      set: function(socket){
        jData.setUserInfo("socket", socket);
      }
    }
  }
}])
.factory("jData", ['$http', function($http){
  function JadenInfoData(){
    var vm = this;
    vm.userInfo = {"userId":null, "name":null, "socket":null};

    vm.setUserInfo = function(name, data){
      vm.userInfo[name] = data;
    }
  }

  return new JadenInfoData();
}]);

JadenApp.config(['$stateProvider', '$urlRouterProvider','$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
      $stateProvider
      .state('app', {
        url: "/",
        views: { 'content':{ component: 'gerald' }  }
      })
      .state('app.phoebe', {
        url: "Video",
        views: { 'content@': { component: 'phoebe' } }
      })
      .state('app.harvey', {
        url: "Messanger",
        views: { 'content@': { component: 'harvey' } }
      })
      .state('app.fuzzy', {
        url: "FuzzySlippers",
        views: { 'content@': { component: 'fuzzyslippers' } }
      })
      .state('app.login', {
        url: "Login",
        views: { 'content@': { component: 'jlogin' } }
      })
      .state('app.construction', {
        url: "underconstruction",
        views: {
          'content@': { component: 'construction' }
        }
      });

      $urlRouterProvider.otherwise('/');
      $locationProvider.html5Mode(true);
    }]);

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

// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('gerald', {
   bindings: {},
	controller: function (jInfo) {
      // Login Check
      if(jInfo.check.jlogin()){
        var userId = jInfo.user.get.userId();

        var ctrl = this;
  		  ctrl.title = "Gerald";

        ctrl.welcome = "Welcome " + userId;
      }
   },
   templateUrl: 'views/ps118/gerald.html'
});


components.component('harvey', {
   bindings: {},
	controller: function ($scope, $state, jInfo) {
      // Login Check
      if(jInfo.check.jlogin()){
        var userId = jInfo.user.get.userId();
        var ctrl = this;

        var socket = jInfo.socket.get();
        if(socket == null){
          socket = io('http://localhost:1003', { query: "userid="+userId });
          jInfo.socket.set(socket);
        }
        //var socket = io();
        var d = new Date();

  		  ctrl.title = "Harvey 'The Mailman'";
        ctrl.userId = userId;
        ctrl.privateId = "";

        ctrl.userMsg = "";
        ctrl.userPrivateMsg = "";
        ctrl.userRoomMsg = "";

        ctrl.connStatus = "disconnect";
        ctrl.roomConnStatus = "connect";

        ctrl.messages = [{"time": d.getTime() , "info":{"msg":"DEFAULT MSG"} }];
        ctrl.privateMessages = [{"time": d.getTime() , "info":{"msg": "DEFAULT PRIVATE MSG"}}];
        ctrl.roomMessages = [{"time": d.getTime() , "info":{"msg": "DEFAULT ROOM MSG"}}];

        /*Toggle connections*/
        ctrl.toggleConnection = function(roomid){
          if(roomid == 'general'){
            if(ctrl.connStatus == 'connect'){
              socket.connect();
              ctrl.connStatus = "disconnect";
            }
            else {
              socket.disconnect();
              ctrl.connStatus = "connect";
            }
          }
          else {
            if(ctrl.roomConnStatus == 'connect'){
              socket.emit('join room', {"roomId":roomid, "info":{"userId":ctrl.userId} } );
              ctrl.roomConnStatus = "disconnect";
            }
            else {
              socket.emit('leave room', {"roomId":roomid, "info":{"userId":ctrl.userId} } );
              ctrl.roomConnStatus = "connect";
            }
          }
        }

        /* Send Message*/
        ctrl.sendMsg = function(roomid) {
          if(roomid == 'general'){
            socket.emit('general', {"userId":ctrl.userId ,"msg":ctrl.userMsg} );
            ctrl.userMsg = "";
          }
          else if(roomid == 'private'){
            socket.emit('private message', {"privateId":ctrl.privateId, "info":{"userId":ctrl.userId ,"msg":ctrl.userPrivateMsg} } );
            ctrl.privateMessages.push({"time": d.getTime(), "info":{"userId":ctrl.userId ,"msg":ctrl.userPrivateMsg} });
            ctrl.userPrivateMsg = "";
          }
          else if(roomid == 'special'){
            socket.emit('room message', {"roomId":ctrl.privateId, "info":{"userId":ctrl.userId ,"msg":ctrl.userRoomMsg} } );
            ctrl.roomMessages.push({"time": d.getTime(), "info":{"userId":ctrl.userId ,"msg":ctrl.userRoomMsg} });
            ctrl.userRoomMsg = "";
          }
        }

        /* Socket Events */

        // socket connection
        socket.on('connect', function(){
          // send id with Socket ID
          var d = new Date();
          ctrl.messages.push({"time": d.getTime(), "info": {"msg": " > Connected"}});
          $scope.$apply();
        });

        // socket disconnection
        socket.on('disconnect', function(){
          var d = new Date();
          ctrl.messages.push({"time": d.getTime(), "info": {"msg":" x Disconnected"}});
          $scope.$apply();
        });

        // socket general messages
        socket.on('general', function(msg){
          var d = new Date();
          ctrl.messages.push({"time": d.getTime(), "info":msg});
          $scope.$apply();
        });

        // socket private messages
        socket.on('private message', function(msg){
          var d = new Date();
          ctrl.privateMessages.push({"time": d.getTime(), "info":msg});
          $scope.$apply();
        });

        // socket private messages
        socket.on('room message', function(msg){
          var d = new Date();
          ctrl.roomMessages.push({"time": d.getTime(), "info":msg});
          $scope.$apply();
        });
      }
   },
   templateUrl: 'views/ps118/harvey.html'
});

components.component('jHeader', {
  bindings: {},
	require: {
      parent: '^jaden'
  },
	controller: function ($timeout, $mdSidenav, $log, $state) {
    var ctrl = this;


   },
   templateUrl: 'views/_header.html'
});

// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('jaden', {
   bindings: {},
	controller: function () {
      var ctrl = this;
		  ctrl.title = "Jaden";
   },
   templateUrl: 'views/jaden.html'
});

// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('jlogin', {
   bindings: {},
	controller: function ($state, jInfo) {
      var ctrl = this;
		  ctrl.title = "Login";

      ctrl.userId = "";

      ctrl.login = function() {
        if(ctrl.userId != ""){
          jInfo.user.set.userId(ctrl.userId);
          $state.go('app');
        }
      }
   },
   templateUrl: 'views/ps118/login.html'
});

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

        socket.on('frame', function (data) {
          console.log("Get Some Data");
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
