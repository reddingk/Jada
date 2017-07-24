components.component('jOutline', {
  bindings: {},
	require: {
      parent: '^jaden'
  },
	controller: function ($timeout, $mdSidenav, $log, $state, $scope) {
    var ctrl = this;

    ctrl.getOrbes = function(num){
      return new Array(num);
    }

    ctrl.setOrbes = function(){      
      var fields = $('.orbit-orbe');
      var container = $('.orbit-l1');
      var width = container.width();
      var height = container.height();
      var angle = 0;
      var step = (2 * Math.PI) / fields.length;
      var radius = width/2;

      fields.each(function() {
        var x = Math.round(width / 2 + radius * Math.cos(angle) - $(this).width() / 2);
        var y = Math.round(height / 2 + radius * Math.sin(angle) - $(this).height() / 2);
        
        $(this).css({ left: x + 'px', top: y + 'px' });
        angle += step;
      });
    }

    // Set Orbes
    ctrl.setOrbes();

    // Set on resize
    window.onresize = function(){
    	setTimeout(function(){
				ctrl.setOrbes();
				$scope.$apply();
			}, 100);
		};

   },
   templateUrl: 'views/ps118/common/_outline.html'
});