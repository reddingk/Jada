'use strict';

var underscore = require('underscore');
var nerves = require('./jnerves');
var phraseDB = require('./config/models/phrases');

const Data = require('./jdata.js');
let data = new Data('../settings.json');

exports.parrot = function polly(phrase) { console.log("You entered in " + phrase); };


// Main Talk function
exports.Extalk = function jconvo(phrase, callback) {
  var tmpStr = phrase.split(" ");
  var actionCall = null;
  var phraseLibrary = null;
  var fullPhraseLibrary = null;

  data.getPhrases( function(res) {
    if(res == null){
      callback({ "todo":"", "jresponse": "Sorry There was an issue connectecting to DB", "japi": {"code":-777 } });
    }
    // Check Full Phrases
    fullPhraseLibrary = underscore.filter(res, function(dt){  return dt.type == 'phrase'; });
    for(var j=0; j < fullPhraseLibrary.length; j++){
      if(phrase.search(fullPhraseLibrary[j].action) > -1){
        actionCall = fullPhraseLibrary[j];
      }
    }
    // Check Action Phrases
    phraseLibrary = underscore.filter(res, function(dt) {  return dt.type != 'phrase'; });
    for(var i=0; i < phraseLibrary.length; i++){
      if(tmpStr.indexOf(phraseLibrary[i].action) > -1 || (phraseLibrary[i].additional_phrases != undefined && checkAllPhrases(tmpStr, phraseLibrary[i].additional_phrases)) )
      {
        if(actionCall == null || actionCall.level > phraseLibrary[i].level)
          actionCall = phraseLibrary[i];
      }
    }

    if(actionCall != null){
      var response = getActionResponse(actionCall, chopPhrase(actionCall.action, tmpStr));
      nerves.getDataResponse(response, phrase, function(res){ callback(res); });
    }
    else {
      var response = {"response":"N/A"}
      nerves.getDataResponse(response, "", function(res){ callback(res); });
    }
  });
};


/***** PARSING FUNCTIONS *****/

/*Get the Response Action based action call and the rest of the phrase*/
function getActionResponse(actionCall, phrase) {
  var tmpStr = phrase.split(" ");
  //No response in main there is only a response in subactions
  if(actionCall.response == undefined && actionCall.subactions != undefined){
    return getSubActionResponse(actionCall.subactions, chopPhrase(actionCall.action, tmpStr));
  }
  //Check for subaction responses before returning main response
  else if(actionCall.subactions != undefined) {
    var response = getSubActionResponse(actionCall.subactions, chopPhrase(actionCall.action, tmpStr));
    var res = (response == null? {"response":actionCall.response, "action": actionCall.action } : response);
    
    if(response == null && actionCall.additional_phrases != undefined)
      res.additional_phrases = actionCall.additional_phrases;
    return res;
  }
  //Return main response
  else {
    var res = {"response":actionCall.response, "action": actionCall.action};
    if(actionCall.additional_phrases != undefined)
      res.additional_phrases = actionCall.additional_phrases;

    return res;
  }
};

/*Get the Sub Action based on the phrase*/
function getSubActionResponse(subactions, phrase) {
  var tmpStr = phrase.split(" ");
  var tmpResponse = null;

  for(var i =0; i < subactions.length; i++) {
    if(tmpStr.indexOf(subactions[i].action) > -1 || (subactions[i].additional_phrases != undefined && checkAllPhrases(tmpStr, subactions[i].additional_phrases))) {
      if(tmpResponse == null || tmpResponse.level > subactions[i].level ){
        tmpResponse = subactions[i];
      }
    }
  }

  // Return
  if(tmpResponse != null) {
    if(tmpResponse.subactions == undefined) {
      if(tmpResponse.additional_phrases != undefined) {
        return {"response":tmpResponse.response, "action": tmpResponse.action, "level": tmpResponse.level, "additional_phrases": tmpResponse.additional_phrases};
      }
      else {
        return {"response":tmpResponse.response, "action": tmpResponse.action, "level": tmpResponse.level};
      }
    }
    else {
      return getSubActionResponse(tmpResponse.subactions, chopPhrase(tmpResponse.action, tmpStr));
    }
  }
  else
  { return null; }

};

/*Return the phrase that remains after the action*/
function chopPhrase(action, phrase) {
  var index = phrase.indexOf(action);
  if(index > -1) {
    if((index + 1) < phrase.length) {
      return phrase.slice(index + 1).join(" ");
    }
    else {
      return "";
    }
  }
  else {
    return phrase.join(" ");
  }

}

/*Check the actions additional phrases to see if they are contained in the main phrase*/
function checkAllPhrases(arr1, arr2) {
  var ret = -1;
  if(arr1 != undefined && arr2 != undefined) {
    for(var i =0; i < arr1.length; i++){
      if(arr2.indexOf(arr1[i]) > -1){
        ret = arr2.indexOf(arr1[i]);
      }
    }
  }

  return (ret > -1);
}

/**/
exports.clean = function cleanPhrase(phrase) {
  //var tmpPhrase = phrase;
  var tmpPhrase = phrase.toLowerCase();

  return tmpPhrase;
}
