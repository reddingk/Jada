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
