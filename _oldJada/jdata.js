exports.userSettingsFile = '../settings.json';

exports.greetings = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today", "How's life", "How's your day treating you {0}"];

exports.app_apis_lib = {
    "tasteKid": {"link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"},
    "openWeather": {"link":"http://api.openweathermap.org/data/2.5/", "key":"90c2be179d4c18b392e3e11efa2ee5c1"},
    "iTranslate4": {"link":"http://itranslate4.eu/api/", "key":"d803c195-58f2-4b3d-adcf-4e5bfcc368c2"},
    "googleMapsDirections": {"link":"https://maps.googleapis.com/maps/api/directions/json", "key":"AIzaSyDmVwV-ugBBFPH9QxtFEPubd2X5ojRAH3o"},
    "googlePlaces":{"link":"https://maps.googleapis.com/maps/api/place/autocomplete/json", "key":"AIzaSyBwnJZ2hoaIBKMGHMqEFEqF_faxUTBfcMs"},
    "marvel": {"link":"https://gateway.marvel.com/", "key":"360f1fe1e9174b58521e32bb17e567fe", "privateKey":"2b05e2994b069d96faa718ad5ccf890aa13e100f"},
    "geoAPI": {"link":"http://ip-api.com/json"}
};
/* Return Phrases from Database*/
var Phrases = require('./config/models/phrases');
var phraseLib = [];

function getPhraseLibrary(callback){
  Phrases.find(function(err, phrases){
		if(err){ err; }
		callback(phrases);
	})
};

exports.getPhrases = function(callback) {
  if(phraseLib.length == 0){
    console.log("Getting Phrases From DB");
    getPhraseLibrary(function(res){
        phraseLib = res;
        callback(phraseLib);
    });
  }
  else {
    callback(phraseLib);
  }
}