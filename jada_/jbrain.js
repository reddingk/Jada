'use strict';

var underscore = require('underscore');
var nerves = require('./jnerves');
var phraseDB = require('./config/models/phrases');

const Data = require('./jdata.js');
let data = new Data('../settings.json', true);

exports.parrot = function polly(phrase) { console.log("You entered in " + phrase); };


// Main Talk function
exports.Extalk = function jconvo(phrase, callback) {
  var tmpStr = phrase.split(" ");  
  var phraseLibrary = null;
  var fullPhraseLibrary = null;
  

  data.searchPhrase(tmpStr, function(res){
    console.log("[res1]: " + res);

    // Check Full Phrases    
    if(data.fullPhraseLib == null){
      data.getFullPhrases(function(res){ 
        data.fullPhraseLib = res;     
        getCall(phrase, callback);
      });  
    }
    else {
      getCall(phrase, callback);
    } 
  });
};

/**/
exports.clean = function cleanPhrase(phrase) {
  //var tmpPhrase = phrase;
  var tmpPhrase = phrase.toLowerCase();

  return tmpPhrase;
}

function getCall(phrase, callback){
  var actionCall = null;
  var tmpFull = underscore.filter(data.fullPhraseLib, function(dt){ return phrase.search(dt.action) > -1; });
  actionCall = (tmpFull == null || tmpFull == undefined || tmpFull == '' ? actionCall : underscore.min(tmpFull, function(mt){ return mt.level; }));
  
  console.log("AC: "+ actionCall);
  var response = {"response":"N/A"};
  nerves.getDataResponse(response, "", function(res){ callback(res); });
}