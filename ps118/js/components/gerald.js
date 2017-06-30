// root component: all other components will be under this component
// objects: view - this will store the state and other high level objects
components.component('gerald', {
   bindings: {},
	controller: function (jInfo, jInterface) {
      // Login Check
      if(jInfo.check.jlogin()){
        var userId = jInfo.user.get.userId();

        var ctrl = this;
  		  ctrl.title = "Gerald";

        ctrl.welcome = "Welcome " + userId;

        // Get Local Info: IP, Username
        jInterface.jada.location.local(function(res){
          if(res!= null){
            var location = {'name':userId,'city':res.city, 'region':res.region,'country':res.country};
            jInterface.jada.weather.forecast(location, function(res){
              if(res!=null){
                ctrl.TEST = res;
              }
              else {
                ctrl.TEST = "[ERROR]: No Weather Data";
              }
            });
          }
          else {
            ctrl.TEST = "[ERROR]: No Location"
          }
        });
      }
   },
   templateUrl: 'views/ps118/gerald.html'
});
