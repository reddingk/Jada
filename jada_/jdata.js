exports.userSettingsFile = './settings.json';
//exports.userSettingsFile = { "name": {"fullname":"Kristopher Redding", "nickname":"Kris"}, "voice":"off"};

exports.greetings = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today", "How's life", "How's your day treating you {0}"];

exports.app_apis = [
    {"name":"tasteKid", "link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"},
    {"name":"openWeather", "link":"http://api.openweathermap.org/data/2.5/", "key":"90c2be179d4c18b392e3e11efa2ee5c1"},
    {"name":"iTranslate4", "link":"http://itranslate4.eu/api/", "key":"76b7b3b3-d336-4b0d-bf11-a51ac5a2fcdd"},
    {"name":"googleMapsDirections", "link":"https://maps.googleapis.com/maps/api/directions/json", "key":"AIzaSyDmVwV-ugBBFPH9QxtFEPubd2X5ojRAH3o"}
];
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
//
/*
  PHRASE LIBRARY
  action: ACTION WORD
  response: RESPONSE FUNCTION
  additional_phrases: ADDITIONAL PHRASEING FOR SAME ACTION
  subactions: SUB ACTIONS UNDER SAME CATEGORY
*/
var phraseLibrary_BackUp = [
  {"action": "test", "level":0, "response":"testCode"},
  {"action": "change", "level":0, "subactions":[{"action":"my", "level":1, "subactions":[{"action":"fullname", "level":1, "response":"changeFullName"}, {"action":"nickname", "level":1, "response":"changeNickname"},{"action":"voice", "level":1, "response":"changeVoice"}]}]},
  {"action": "hello", "level":0, "response":"greetings", "additional_phrases":["hi", "hey", "hola", "greetings"]},
  {"action": "date", "level":1, "response":"getLocalDate", "subactions":[ {"action":"in", "response":"getTimeZoneDate"}]},
  {"action": "translate", "level":2, "response":"translatePhrase"},
  {"action": "media", "level":1, "additional_phrases":["books", "music","movies","shows","games","authors"], "subactions":[ {"action":"similar", "level":1, "response":"getTastekidResults"} ]},
  {"action": "time", "level":2, "response":"getLocalTime", "subactions":[ {"action":"in", "response":"getTimeZoneTime"}]},
  {"action": "weather", "level":2, "response":"getWeatherCurrent", "subactions":[{"action":"forecast", "level":2, "response":"getWeatherForecast"}, {"action":"details", "level":1, "response":"getWeatherDetailedForecast"} ]},
  {"action": "directions", "level":2, "response":"getDirections"},
  {"action": "who", "level":2, "subactions":[{"action": "am", "level":2, "response":"relationshipGuide"}, {"action": "is", "level":2, "response":"relationshipGuide"}]},
  {"action": "where", "level":2, "subactions":[{"action": "am", "level":2, "response":"locationGuide"}, {"action": "is", "level":2, "response":"locationGuide"}]},

  {"action": "remember", "level":3, "subactions":[{"action": "location", "level":3, "response":"addUserSetting"}, {"action": "relationship", "level":3, "response":"addUserSetting"}]},
  {"action": "replace", "level":3, "response":"replaceLastAction", "subactions":[{"action": "location", "level":3, "response":"replaceUserSetting"}, {"action": "relationship", "level":3, "response":"replaceUserSetting"}]},

  {"action": "cpu", "level":10, "subactions":[{"action": "architecture", "level":10, "response":"getCpuArch", "additional_phrases":["arch"]}, {"action": "information", "level":10, "response":"getCpuInfo", "additional_phrases":["info"]}]},
  {"action": "computers", "level":10, "subactions":[ {"action":"hostname", "level":10, "response":"getComputerHostname"}]},
  {"action": "network", "level":10, "subactions":[ {"action":"interface", "level":10, "response":"getNetworkInterface"}]},
  {"action": "system", "level":10, "subactions":[{"action": "release", "level":10, "response":"getSystemRelease"}, {"action": "memory", "level":10, "response":"getSystemMemory"}]}
];

var fullPhrase_Backup = [
  {"type":"phrase", "action":"do you know the muffin man", "level":101, "response":"easterEggs"},
  {"type":"phrase", "action":"how are you", "level":101, "response":"easterEggs"}
];
