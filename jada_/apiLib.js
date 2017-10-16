'use strict';

var func = require('./jnerves');
var request = require('request');
const Data = require('./jdata.js');
let data = new Data('../settings.json', false);

var md5 = require('md5');

function getApiItem(name){
  var item = data.app_apis_lib[name];
  return (item == undefined ? null : item);
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
          else {
            callback(JSON.parse({"error":"error returning data", "statusCode": response.statusCode}));
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
          if(!error && response.statusCode === 200){
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

exports.getMarvelCharacter = function getMarvelCharacter(search, callback) {
  var api = getApiItem("marvel");
  var timestamp = Date.now();
  var hashstatement = func.stringFormat("{0}{1}{2}",[timestamp,api.privateKey, api.key]);
  if(api != null){
    try{
      var url = func.stringFormat("{0}/v1/public/characters?name={1}&apikey={2}&ts={3}&hash={4}", [api.link, search, api.key, timestamp, md5(hashstatement)]);
      request(url,
        function (error, response, body){
          if(!error && response.statusCode === 200){
            callback(JSON.parse(body));
          }
        });
    }
    catch(err){
      console.log("Err: " + err);
      callback(null);
    }
  }
  else {
    callback(null);
  }

}

exports.getIPLocation = function getIPLocation(callback){
  var api = getApiItem("geoAPI");

  if(api != null){
    try{
      var url = api.link;
      request(url,
        function (error, response, body){
          if(!error && response.statusCode === 200){
            callback(JSON.parse(body));
          }
        });
    }
    catch(err){
      callback(null);
    }
  }
}
