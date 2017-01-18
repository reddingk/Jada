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
