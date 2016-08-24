var func = require('./jnerves');

exports.parrot = function polly(phrase) { console.log("You entered in " + phrase); };

/*Main convo function*/
exports.talk = function jconvo(phrase) {
  var tmpStr = phrase.split(" ");
  var actionCall = null;

  for(var i=0; i < phraseLibrary.length; i++){
    if(tmpStr.indexOf(phraseLibrary[i].action) > -1 || (phraseLibrary[i].additional_phrases != undefined && checkAllPhrases(tmpStr, phraseLibrary[i].additional_phrases)) )
    {
      if(actionCall == null || actionCall.level > phraseLibrary[i].level)
        actionCall = phraseLibrary[i];
    }
  }

  if(actionCall != null){
    var response = getActionResponse(actionCall, chopPhrase(actionCall.action, tmpStr));
    return func.getDataResponse(response, phrase);
  }
  else {
    var response = {"response":"N/A"}
    return func.getDataResponse(response, "");
  }

};

/***** PARSING FUNCTIONS *****/

/*Get the Response Action based action call and the rest of the phrase*/
function getActionResponse(actionCall, phrase) {
  var tmpStr = phrase.split(" ");
  //No response in main there is only a response in subactions
  if(actionCall.response == undefined && actionCall.subactions != undefined)
  {
    return getSubActionResponse(actionCall.subactions, chopPhrase(actionCall.action, tmpStr));
  }
  //Check for subaction responses before returning main response
  else if(actionCall.subactions != undefined )
  {
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
  for(var i =0; i < subactions.length; i++) {
    if(tmpStr.indexOf(subactions[i].action) > -1) {
      if(subactions[i].subactions == undefined) {
        if(subactions[i].additional_phrases != undefined) {
          return {"response":subactions[i].response, "action": subactions[i].action, "additional_phrases": subactions[i].additional_phrases};
        }
        else {
          return {"response":subactions[i].response, "action": subactions[i].action};
        }
      }
      else {
        return getSubActionResponse(subactions[i].subactions, chopPhrase(subactions[i].action, tmpStr));
      }
    }
  }

  return null;
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
/*
  PHRASE LIBRARY
  action: ACTION WORD
  response: RESPONSE FUNCTION
  additional_phrases: ADDITIONAL PHRASEING FOR SAME ACTION
  subactions: SUB ACTIONS UNDER SAME CATEGORY
*/
var phraseLibrary = [
  {"action": "hello", "level":0, "response":"greetings", "additional_phrases":["hi", "hey"]},
  {"action": "time", "level":1, "response":"getLocalTime", "subactions":[ {"action":"in", "response":"getTimeZoneTime"}]},
  {"action": "date", "level":1, "response":"getLocalDate", "subactions":[ {"action":"in", "response":"getTimeZoneDate"}]},
  {"action": "media", "level":1, "additional_phrases":["books", "music","shows","games","authors"], "subactions":[ {"action":"similar", "level":1, "response":"getTastekidResults"} ]}
];
