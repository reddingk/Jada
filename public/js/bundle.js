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
	controller: function () {
      var ctrl = this;
		  ctrl.title = "Harvey 'The Mailman'";
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
