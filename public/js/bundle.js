'use strict';

var routes = angular.module('routes', ['ui.router']);
var directives = angular.module('directives', []);
var components = angular.module('components', ['ui.bootstrap', 'ngAnimate', 'ngSanitize']);

var JadenApp = angular.module('JadenApp', ['ngMaterial', 'ngAnimate', 'ui.router', 'directives',	'components',	'routes']);

JadenApp.config(['$stateProvider', '$urlRouterProvider','$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
      $stateProvider
      .state('app', {
        url: "/",
        views: {
          'content':{
            component: 'gerald'
          }
        }
      })
      .state('app.harvey', {
        url: "messanger",
        views: {
          'content@': {
            component: 'harvey'
          }
        }
      })
      .state('app.construction', {
        url: "underconstruction",
        views: {
          'content@': {
            component: 'construction'
          }
        }
      });

      $urlRouterProvider.otherwise('/');
      //$locationProvider.html5Mode(true);
    }]);

// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('gerald', {
   bindings: {},
	controller: function () {
      var ctrl = this;
		  ctrl.title = "Gerald";
   },
   templateUrl: 'views/ps118/gerald.html'
});


components.component('harvey', {
   bindings: {},
	controller: function ($scope) {
      var ctrl = this;
      var socket = io('http://localhost:1003', { query: "userid=testAdmin" });
      //var socket = io();
      var d = new Date();

		  ctrl.title = "Harvey 'The Mailman'";
      ctrl.userId = "";
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
