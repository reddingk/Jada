var func = require('./jnerves');
var request = require('request');
var data = require('./jdata');

function getApiItem(name){
  var item = null;
  for(var i =0; i < data.app_apis.length; i++) {
    if(data.app_apis[i].name == name)
      { item = data.app_apis[i]; }
    }
    return item;
}

exports.tastekid = function tatekid(query, type, info, limit, callback) {
  var api = getApiItem("tasteKid");
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

exports.openweathermap = function openweathermap(type, location, callback){
  var api = getApiItem("openWeather");

  if(api != null){
    try {
      //find,weather,forecast
      var url = func.stringFormat(api.link +"{0}?q={1}&appid={2}&units=imperial", [type,location.replace(" ", "+"), api.key]);

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

}
