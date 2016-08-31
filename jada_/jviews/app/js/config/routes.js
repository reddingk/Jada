(function(){

  angular
    .module('config')
    .config(['$stateProvider', '$urlRouterProvider','$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
      $stateProvider
      .state('app', {
        url: "/",
        views: {
          'content':{
            templateUrl: 'views/home.html'
          }
        }
      })
      .state('app.imgfacialrecog', {
        url: "ifr",
        views: {
          'content@': {
            templateUrl: 'views/imgfacialRecog.html',
            controller: 'IFRController as ifrc'
          }
        }
      })



      $urlRouterProvider.otherwise('/');
      //$locationProvider.html5Mode(true);
    }]);


})();
