'use strict';

/*
 * JADA DATA CLASS
 * By: Kris Redding
 */
var phraseDB = require('./config/models/phrases');

class JDATA {
  constructor(settingsFile, getFull){
    this.phraseLib = [];
    this.fullPhraseLib = null;

    this.userSettingsFile = settingsFile;
    this.greetings = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today", "How's life", "How's your day treating you {0}"];
    this.app_apis_lib =  {
        "tasteKid": {"link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"},
        "openWeather": {"link":"http://api.openweathermap.org/data/2.5/", "key":"90c2be179d4c18b392e3e11efa2ee5c1"},
        "iTranslate4": {"link":"http://itranslate4.eu/api/", "key":"d803c195-58f2-4b3d-adcf-4e5bfcc368c2"},
        "googleMapsDirections": {"link":"https://maps.googleapis.com/maps/api/directions/json", "key":"AIzaSyDmVwV-ugBBFPH9QxtFEPubd2X5ojRAH3o"},
        "googlePlaces":{"link":"https://maps.googleapis.com/maps/api/place/autocomplete/json", "key":"AIzaSyBwnJZ2hoaIBKMGHMqEFEqF_faxUTBfcMs"},
        "marvel": {"link":"https://gateway.marvel.com/", "key":"360f1fe1e9174b58521e32bb17e567fe", "privateKey":"2b05e2994b069d96faa718ad5ccf890aa13e100f"},
        "geoAPI": {"link":"http://ip-api.com/json"}
    };
  }

  /* Functions */  
  getPhrases(callback) {
    if(this.phraseLib == null || this.phraseLib.length == 0){
      console.log(" > Getting Phrases From DB");
      phraseDB.find(function(err, res){
        if(err){ err; }
        if(res == null|| res == undefined) { res = [];}
        this.phraseLib = res;
        callback(this.phraseLib);
      });
    }
    else {
      callback(this.phraseLib);
    }
  }

  getFullPhrases(callback){
    //console.log(" > Getting all full phrases");
    if(this.fullPhraseLib == null) {
      phraseDB.find({ 'type' : 'phrase' }, function(err, res){
        if(res == null|| res == undefined) { res = [];}        
        callback(res);
      });
    }
    else {
      callback(this.fullPhraseLib);
    }
  }

  searchPhrase(wordList, callback) {
    //console.log(" > Getting actions for: " + wordList.join(" "));

    phraseDB.find({'$and': [
        {'type': { '$ne': 'phrase' }},
        {'$or': [
          {'action': {'$in': wordList}},
          {'additional_phrases': {'$elemMatch': {'$in': wordList}}}
        ]}
    ]}, function(err, res){ 
      if(res == null || res == undefined) { res = [];} 
      callback(res);
    });
  }

}

module.exports = JDATA;
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
  {"action": "marvel", "level":4, "subactions": [{"action": "characters", "level":4, "response":"marvelCharacter"}]},

  {"action": "cpu", "level":10, "subactions":[{"action": "architecture", "level":10, "response":"getCpuArch", "additional_phrases":["arch"]}, {"action": "information", "level":10, "response":"getCpuInfo", "additional_phrases":["info"]}]},
  {"action": "computers", "level":10, "subactions":[ {"action":"hostname", "level":10, "response":"getComputerHostname"}]},
  {"action": "network", "level":10, "subactions":[ {"action":"interface", "level":10, "response":"getNetworkInterface"}]},
  {"action": "system", "level":10, "subactions":[{"action": "release", "level":10, "response":"getSystemRelease"}, {"action": "memory", "level":10, "response":"getSystemMemory"}]}
];

var fullPhrase_Backup = [
  {"type":"phrase", "action":"do you know the muffin man", "level":101, "response":"easterEggs"},
  {"type":"phrase", "action":"how are you", "level":101, "response":"easterEggs"}
];
