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

exports.tastekid = function tatekid(query, type, info, limit, callback) {
  var api = getApiItem("tasteKid");
  var results = "??";
  if(api != null){
    try {
      //callback=JSON_CALLBACK
      var url = func.stringFormat(api.link + "similar?q={0}&k={1}&type={2}&info={3}&limit={4}",[query, api.key, type, info, limit]);

      request({ url: url, json: true},
        function (error, response, body){
          if(!error && response.statusCode ===200){
            callback(body);
          }
        });
    }
    catch(err) {
      console.log("Err 2" + err);
    }
  }
  else {
    console.log("Else null");    
  }
};
