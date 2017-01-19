// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('fuzzyslippers', {
   bindings: {},
	controller: function (jInfo) {
      // Login Check
      if(jInfo.check.jlogin()){
        var userId = jInfo.user.get.userId();

        var ctrl = this;
  		  ctrl.title = "Fuzzy Slippers";

        ctrl.welcome = "Welcome " + userId;
      }
   },
   templateUrl: 'views/ps118/fuzzyslippers.html'
});
