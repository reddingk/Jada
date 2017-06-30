services.service('jInterface',['iData','$filter', '$state','$http', function JadaInterface(iData, $filter, $state, $http){

  return {
    jada:{
      talk:function(phrase, callback){
        iData.jadaRequest(location, callback);
      },
      location: {
        local: function(callback){                    
            iData.simpleRequest(iData.urlLib.ipAdd, callback);
        }
      },
      weather: {          
          forecast:function(location, callback){
              var locPhrase = {'name':location.name,'phrase':'get weather for '+location.city+','+location.region+','+location.country};
              iData.jadaRequest(locPhrase, callback);              
          }
      }
    }
  }
}]).factory("iData", ['$http', function($http){
  function InterfaceData(){
    var vm = this;
    var baseurl = getBaseUrl();
    vm.urlLib = {"ipAdd":"http://ip-api.com/json"};

    // Get Base URL
    function getBaseUrl(){
        var pathArray = location.href.split( '/' );
        var protocol = pathArray[0];
        var host = pathArray[2];
        var url = protocol + '//' + host +'/';

        return url;
    }
    // Simple Request
    vm.simpleRequest = function(reqURL, callback){
        $http({
            method: 'GET', url: reqURL,
            headers: {'Content-Type': 'application/json' }
        }).then(function successCallback(response) {
            if(response != undefined && response.data != undefined ){
                callback(response.data);
            }
            else {
                callback(null);
            }
        }, function errorCallback(response){
            callback(response);
        });
    }

    // Jada Request
    vm.jadaRequest = function(phraseData, callback){
        $http({
            method: 'POST', 
            url: baseurl+'jada/talk',
            headers: {'Content-Type': 'application/json' },
            data: phraseData
        }).then(function successCallback(response) {
            if(response != undefined && response.data != undefined ){
                callback(response.data);
            }
            else {
                callback(null);
            }
        }, function errorCallback(response){
            callback(response);
        });
    }
  }

  return new InterfaceData();
}]);
