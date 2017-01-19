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
