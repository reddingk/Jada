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

exports.itranslate4 = function itranslate4(src, target, phrase, callback){
  var api = getApiItem("iTranslate4");

  if(api != null){
    try {

      var url = (src == null && target == null ? func.stringFormat(api.link +"GetLanguages?auth={0}", [api.key]) : func.stringFormat(api.link +"Translate?auth={0}&src={1}&trg={2}&dat={3}", [api.key, src, target, phrase]));

      request(url,
        function (error, response, body){
          if(!error && response.statusCode ===200){
            callback(JSON.parse(body));
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

exports.googleDirections = function googleDirections(type, fromLoc, toLoc, callback){
  var api = getApiItem("googleMapsDirections");

  if(api != null){
    try {
      var url = func.stringFormat(api.link +"?key={0}&origin={1}&destination={2}&mode={3}", [api.key, fromLoc, toLoc, type]);

      request(url,
        function (error, response, body){
          if(!error && response.statusCode ===200){
            callback(JSON.parse(body));
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
