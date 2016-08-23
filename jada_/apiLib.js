var func = require('./jnerves');

//exports.parrot = function polly(phrase) { console.log("You entered in " + phrase); };
var app_apis = [
    {"name":"tasteKid", "link":"https://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"}
];
function getApiItem(name){
  var item = null;
  for(var i =0; i < vm.app_apis.length; i++) {
    if(vm.app_apis[i].name == name)
      { item = vm.app_apis[i]; }
    }
    return item;
}

exports.tastekid = function tatekid(query, type, info, limit) {
  console.log("Here 1");
  var api = getApiItem("tasteKid");
  console.log("Here 2");
  if(api != null){
    console.log("Here 3");
    try {
      var url = func.stringFormat(api.link + "similar?q={0}&callback=JSON_CALLBACK&k={1}&type={2}&info={3}&limit={4}",[query, api.key, type, info, limit]);

      return url;
    }
    catch(err) {
      return err;
    }
  }
  else {
    return null;
  }
};
