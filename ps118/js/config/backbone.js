services.service('jInfo',['jData', '$filter', '$state', function JadenInfo(jData, $filter, $state){
  var userCache = jData.userInfo;

  return {
    check:{
      jlogin:function(){
        if(jData.userInfo.userId != null) { return true;}
        else { $state.go('app.login'); return false;}
      }
    },
    user: {
      all:function(){
        return userCache;
      },
      get: {
        userId: function(){
          return jData.userInfo.userId;
        }
      },
      set: {
        userId: function(id){
          jData.setUserInfo("userId", id);
        }
      }
    },
    socket: {
      get: function(){
        return jData.userInfo.socket;
      },
      set: function(socket){
        jData.setUserInfo("socket", socket);
      }
    }
  }
}])
.factory("jData", ['$http', function($http){
  function JadenInfoData(){
    var vm = this;
    vm.userInfo = {"userId":null, "name":null, "socket":null};

    vm.setUserInfo = function(name, data){
      vm.userInfo[name] = data;
    }
  }

  return new JadenInfoData();
}]);
