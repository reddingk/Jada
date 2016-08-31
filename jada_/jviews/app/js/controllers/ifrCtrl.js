(function(){
 "use strict";

  // Controller
  angular.module('ifrCtrl').controller('IFRController', ['$state','$scope', '$q', '$log', function($state, $scope, $q, $log){
    var vm = this;
    /*Functions*/
    vm.plot = plot;
    vm.track = trackFaces;
    $scope.getFile = getFile;

    /*Variables*/
    vm.directions = "Please Select A File To begin tracking faces";
    vm.mainimg = null;

    /**/
     function plot(img, x, y, w, h) {
      var rect = document.createElement('div');
      document.querySelector('.img-container').appendChild(rect);
      rect.classList.add('rect');
      rect.style.width = w + 'px';
      rect.style.height = h + 'px';
      rect.style.left = (img.offsetLeft + x) + 'px';
      rect.style.top = (img.offsetTop + y) + 'px';
    };

    function track(callback) {
        var img = document.getElementById('view-img');
        var tracker = new tracking.ObjectTracker(['face']);
        tracker.setStepSize(1.2);

        tracking.track('#view-img', tracker);

        tracker.on('track', function(event) {
          event.data.forEach(function(rect) {
            vm.plot(img, rect.x, rect.y, rect.width, rect.height);
          });

          callback(false);
        });
    }
    function trackFaces() {
      $('.tracking-mask').removeClass('noshow');
      $('.rect').remove();
      track(function(results) { $('.tracking-mask').addClass('noshow'); });
    }

    /*Upload Functions*/
    function onLoad(reader, deferred, scope) {
        return function () {
            scope.$apply(function () {
                deferred.resolve(reader.result);
            });
        };
    };

    var onError = function onError(reader, deferred, scope) {
        return function () {
            scope.$apply(function () {
                deferred.reject(reader.result);
            });
        };
    };

    function onProgress(reader, scope) {
        return function (event) {
            scope.$broadcast("fileProgress",
                {
                    total: event.total,
                    loaded: event.loaded
                });
        };
    };

    function getReader(deferred, scope) {
        var reader = new FileReader();
        reader.onload = onLoad(reader, deferred, scope);
        reader.onerror = onError(reader, deferred, scope);
        reader.onprogress = onProgress(reader, scope);
        return reader;
    };

    function readAsDataURL(file, scope) {
        var deferred = $q.defer();

        var reader = getReader(deferred, scope);
        reader.readAsDataURL(file);

        return deferred.promise;
    };

    function getFile(file) {
      $('.rect').remove();
      readAsDataURL(file, $scope).then(function(result) { vm.mainimg = result; });
    }

  }]);

  // directive
  angular.module('directives').directive('ngFileSelect', function() {
    return {
      restrict: 'EA',
      link: function ($scope, element) {

        element.bind("change", function(e){
          //$scope.file = (e.srcElement || e.target).files[0];
          //$scope.getFile();

          var file = (e.srcElement || e.target).files[0];
          $scope.getFile(file);
        });
      }
    }
  });

})();
