'use strict';

/*
 * JADA LANGUAGE CLASS
 * By: Kris Redding
 */

var phraseDB = require('./config/models/phrases');
var underscore = require('underscore');

const Tools = require('./jtools.js');


class JLANGUAGE { 
    constructor(){
        this.phraseLib = [];
        this.fullPhraseLib = null;
        this.greetings = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today", "How's life", "How's your day treating you {0}"];

        this.jTools = new Tools();
    }

    /* Functions */  
    cleanPhrase(phrase) {    
        var tmpPhrase = phrase.toLowerCase();      
        return tmpPhrase;
    }

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
                console.log(" [2]>");
                if(res == null|| res == undefined) { res = [];}        
                callback(res);                
            });

            /*  TEST  */
            callback([ { _id: '58764602f36d284ed588a889', type: 'phrase', response: 'easterEggs', level: '101', action: 'do you know the muffin man' },{ _id: '587671b7f36d284ed588c9bf', type: 'phrase', response: 'easterEggs', level: '101', action: 'how are you' } ]);
        }
        else {
            callback(this.fullPhraseLib);
        }
    }

    searchPhrase(wordList, callback) {
        
        phraseDB.find({'$and': [
            {'type': { '$ne': 'phrase' }},
            {'$or': [
            {'action': {'$in': wordList}},
            {'additional_phrases': {'$elemMatch': {'$in': wordList}}}
            ]}
        ]}, function(err, res){ 
            console.log(" [1]>");            
            if(res == null || res == undefined) { res = [];}                            
            callback(res);
        });
        /*  TEST  */
        callback([{ _id: '58751c73f36d285ed998acdc', additional_phrases: [ 'hi', 'hey', 'hola', 'greetings' ], response: 'greetings', level: '0', action: 'hello' }]);
    }

    /* Get Phrase Action Call */
    getCall(phrase, acList){
        var self = this;
        var actionCall = null;
        var response = null;

        try {
            var phraseSplit = phrase.split(" ");        
            var tmpFull = underscore.filter(self.fullPhraseLib, function(dt){ return phrase.search(dt.action) > -1; });
            
            if(tmpFull == null || tmpFull == undefined || tmpFull == ''){
                actionCall = underscore.min(acList, function(mt){ return mt.level; });
            } 
            else {
                actionCall = underscore.min(tmpFull, function(mt){ return mt.level; });
            }

            if(actionCall != null){
                var response = self.getActionResponse(actionCall, self.chopPhrase(actionCall.action, phraseSplit));      
            }
            else {
                var response = {"response":"N/A"}
            }
        }
        catch(ex){
            console.log("Error Processing Language [jl0]");
        }

        return response;
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

module.exports = JLANGUAGE;

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