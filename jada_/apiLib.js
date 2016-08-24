var func = require('./jnerves');
var request = require('request');
var rp = require('request-promise');
var http = require('http');
var q = require('q');

//exports.parrot = function polly(phrase) { console.log("You entered in " + phrase); };
var app_apis = [
    {"name":"tasteKid", "link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"}
];
function getApiItem(name){
  var item = null;
  for(var i =0; i < app_apis.length; i++) {
    if(app_apis[i].name == name)
      { item = app_apis[i]; }
    }
    return item;
}

exports.tastekid = function tatekid(query, type, info, limit) {
  var api = getApiItem("tasteKid");
  var results = "??";
  if(api != null){
    try {
      //callback=JSON_CALLBACK
      var url = func.stringFormat(api.link + "similar?q={0}&k={1}&type={2}&info={3}&limit={4}",[query, api.key, type, info, limit]);

      // Get values from api
      console.log("U: " + url);
      //request
      /*request(url, function (error,response,body) {
        console.log(body);
      });*/

      //request-promise
      var def = q.defer();
      rp(url)
        .then(function(data){
          def.resolve(data);
          //console.log("LIB: " + data);
        })
        .catch(function(err){
          console.log("Catch error");
          //return "ERR - NO DATA";
        });

        return def.promise;
      //return url;
    }
    catch(err) {
      console.log("Err 2" + err);
      //return err;
    }
  }
  else {
    console.log("Else null");
    //return null;
  }
};
