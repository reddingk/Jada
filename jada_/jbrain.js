'use strict';

/*
 * JADA BRAIN CLASS
 * By: Kris Redding
 */

var underscore = require('underscore');
var phraseDB = require('./config/models/phrases');

const Data = require('./jdata.js');
const Nerves = require('./jnerves.js');
const Tools = require('./jtools.js');

class JBRAIN {  
  constructor() {   
    this.jdata = new Data('../settings.json', true);   
    this.jNerves = new Nerves('../settings.json', this); 
    this.jTools = new Tools();   
  }

  /* FUNCTIONS */
  polly(phrase) { console.log("You entered in " + phrase); };

  // Conversation Function
  jConvo(phrase, callback) {
    var self = this;

    var tmpStr = phrase.split(" ");  
    var phraseLibrary = null;
    var fullPhraseLibrary = null;    
  
    self.jdata.searchPhrase(tmpStr, function(res){      
      // Check Full Phrases    
      if(self.jdata.fullPhraseLib == null){
        self.jdata.getFullPhrases(function(fullres){ 
          self.jdata.fullPhraseLib = fullres;     
          self.getCall(phrase, res, callback);
        });  
      }
      else {
        self.getCall(phrase, res, callback);
      } 
    });
  }

  // Convert Phrase to all lower case for parsing
  cleanPhrase(phrase) {    
    var tmpPhrase = phrase.toLowerCase();
  
    return tmpPhrase;
  }

  // Get Function Call Based on Phrase
  getCall(phrase, acList, callback){
    var self = this;
    
    var phraseSplit = phrase.split(" ");
    var actionCall = null;
    var tmpFull = underscore.filter(self.jdata.fullPhraseLib, function(dt){ return phrase.search(dt.action) > -1; });
    
    if(tmpFull == null || tmpFull == undefined || tmpFull == ''){
      actionCall = underscore.min(acList, function(mt){ return mt.level; });
    } 
    else {
      actionCall = underscore.min(tmpFull, function(mt){ return mt.level; });
    }

    if(actionCall != null){
      var response = self.getActionResponse(actionCall, self.chopPhrase(actionCall.action, phraseSplit));      
      self.jNerves.dataResponse(response, phrase, function(res){ callback(res); });
    }
    else {
      var response = {"response":"N/A"}
      self.jNerves.dataResponse(response, "", function(res){ callback(res); });
    }
  }
  
  // Return the phrase that remains after the action
  chopPhrase(action, phrase) {
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

  // Get Action Response
  getActionResponse(actionCall, phrase){
    var self = this;
    var phraseSplit = phrase.split(" ");

    //No response in main there is only a response in subactions
    if(self.jTools.emptyCheck(actionCall.response) && actionCall.subactions != undefined){      
      return self.getSubActionResponse(actionCall.subactions, self.chopPhrase(actionCall.action, phraseSplit));
    }
    //Check for subaction responses before returning main response
    else if(!self.jTools.emptyCheck(actionCall.subactions)) {
      var response = self.getSubActionResponse(actionCall.subactions, self.chopPhrase(actionCall.action, phraseSplit));     
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
  }

  // Get the Sub Action based on the phrase
  getSubActionResponse(subactions, phrase) {
    var self = this;
    var phraseSplit = phrase.split(" ");
    var retResponse = null;
    var subResponses = [];

    // Check for Sub action in remaining phrase
    for(var i=0; i < phraseSplit.length; i++){
      //var tmpResponse = underscore.where(subactions, {action: phraseSplit[i]});
      var tmpResponse = underscore.filter(subactions, function(val){ return ((phraseSplit[i] == val.action)  || (val.additional_phrases != undefined && val.additional_phrases.indexOf(phraseSplit[i]) > -1))  });
      if(tmpResponse != null){
        if(subResponses.length == 0) {
          subResponses = tmpResponse;
        }
        else {
          subResponses.concat(tmpResponse);
        }
      }
    }
    
    retResponse = underscore.min(subResponses, function(mt){ return mt.level; });       
    
    if(retResponse != Infinity) {  
       if(self.jTools.emptyCheck(retResponse.subactions)) {
        var returnObj = {"response":retResponse.response, "action": retResponse.action, "level": retResponse.level};
        
        if(!self.jTools.emptyCheck(retResponse.additional_phrases)) {
          returnObj.additional_phrases = retResponse.additional_phrases;
        }        
        return returnObj;
      }
      else {
        return self.getSubActionResponse(retResponse.subactions, self.chopPhrase(retResponse.action, phraseSplit));
      }
    }
    else {
      return null;
    }
  }



}

module.exports = JBRAIN;