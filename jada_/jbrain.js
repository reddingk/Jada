var func = require('./jnerves');
var data = require('./jdata');

exports.parrot = function polly(phrase) { console.log("You entered in " + phrase); };


// Main Talk function
exports.Extalk = function jconvo(phrase, callback) {
  var tmpStr = phrase.split(" ");
  var actionCall = null;

  for(var i=0; i < data.phraseLibrary.length; i++){
    if(tmpStr.indexOf(data.phraseLibrary[i].action) > -1 || (data.phraseLibrary[i].additional_phrases != undefined && checkAllPhrases(tmpStr, data.phraseLibrary[i].additional_phrases)) )
    {
      if(actionCall == null || actionCall.level > data.phraseLibrary[i].level)
        actionCall = data.phraseLibrary[i];
    }
  }

  if(actionCall != null){
    var response = getActionResponse(actionCall, chopPhrase(actionCall.action, tmpStr));
    func.getDataResponse(response, phrase, function(res){ callback(res); });
  }
  else {
    var response = {"response":"N/A"}
    func.getDataResponse(response, "", function(res){ callback(res); });
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
