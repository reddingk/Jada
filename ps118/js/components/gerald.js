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
