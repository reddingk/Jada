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
