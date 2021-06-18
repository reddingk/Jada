'use strict';

require('dotenv').config();
const fs = require('fs');
const log = require('../server/services/log.service');
const NerveSystem = require('./jnerveSystem.js');

class JLANGUAGE {
    constructor(innerBrain){
        this.jnervesystem = new NerveSystem(innerBrain);
    }

    cleanPhrase(phrase) {
        return phrase.toLowerCase().trim();
    }

    searchPhrase(type, wordList, callback) {
        try {
            callback(offlineGet(type, wordList));
        }  
        catch(ex){
            log.error("(jlanguage) " + type + " phrase: " + ex);
            callback(null);
        } 
    }

    getCall(phrase, acList){ 
        var self = this, actionCall = null, response = {"response":"N/A"};

        try {
            let basedFile = fs.readFileSync(process.env.CONFIG_LOC +'/basedb.json');
            let baseDb = JSON.parse(basedFile);

            var tmpFull = baseDb.phrases.filter(function(fp){
                return fp.type == "phrase" && phrase == fp.action;
            });

            if(!tmpFull || tmpFull.length <= 0){ 
                // Regular Phrase
                actionCall = acList.reduce(function(prev, curr) {
                    return prev.level < curr.level ? prev : curr;
                });
            }
            else {  
                // Full Phrase
                actionCall = tmpFull.reduce(function(prev, curr) {
                    return prev.level < curr.level ? prev : curr;
                });
            }

            if(actionCall != null){
                response = self.getActionResponse(actionCall, chopPhrase(actionCall.action, phrase.split(" ")));
            }
        }
        catch(ex){
            log.error("getting call: " + ex);
        }

        return response;
    }

    getActionResponse(actionCall, phrase){
        var ret = null;

        try {
            var phraseSplit = phrase.split(" ");

            //No response in main there is only a response in subactions
            if(emptyCheck(actionCall.response) && actionCall.subactions != undefined){
                return this.getSubActionResponse(actionCall.subactions, chopPhrase(actionCall.action, phraseSplit));
            }
            //Check for subaction responses before returning main response
            else if(!emptyCheck(actionCall.subactions)) {
                var response = this.getSubActionResponse(actionCall.subactions, chopPhrase(actionCall.action, phraseSplit));
                var res = (response == null? {"response":actionCall.response, "action": actionCall.action } : response);

                if(response == null && actionCall.additional_phrases != undefined) {
                    res.additional_phrases = actionCall.additional_phrases;
                }

                return res;
            }
            //Return main response
            else {
                var res = {"response":actionCall.response, "action": actionCall.action};
                if(actionCall.additional_phrases != undefined){
                    res.additional_phrases = actionCall.additional_phrases;
                }

                return res;
            }
        }
        catch(ex){
            log.error("getting action response: " + ex);
        }

        return ret;
    }

    // Get the Sub Action based on the phrase
    getSubActionResponse(subactions, phrase) {
        var retResponse = null, subResponses = [];

        try {
            var phraseSplit = phrase.split(" ");

            // Check for Sub action in remaining phrase
            for(var i=0; i < phraseSplit.length; i++){
                var tmpResponse = subactions.filter(function(val){ return ((phraseSplit[i] == val.action)  || (val.additional_phrases != undefined && val.additional_phrases.indexOf(phraseSplit[i]) > -1));  });
                if(tmpResponse != null){
                    if(subResponses.length == 0) {
                        subResponses = tmpResponse;
                    }
                    else {
                        subResponses.concat(tmpResponse);
                    }
                }
            }

            retResponse = subResponses.reduce(function(prev, curr) {
                return prev.level < curr.level ? prev : curr;
            });

            if(retResponse){
                if(emptyCheck(retResponse.subactions)) {
                    var returnObj = {"response":retResponse.response, "action": retResponse.action, "level": retResponse.level};
    
                    if(!emptyCheck(retResponse.additional_phrases)) {
                        returnObj.additional_phrases = retResponse.additional_phrases;
                    }
                    return returnObj;
                }
                else {
                    return this.getSubActionResponse(retResponse.subactions, chopPhrase(retResponse.action, phraseSplit));
                }
            }
            else {
                return null;
            }
        }
        catch(ex){
            log.error("getting sub action response: " + ex);
            return null;
        }
    }

    // JNerve Data Response
    dataResponse(response, fullPhrase, userInfo, callback) {
        var finalResponse = {"jresponse": "I have nothing for you sorry"};

        try {
            if(response == null) { callback(finalResponse); }
            else {
                response.fullPhrase = fullPhrase;
                response.userInfo = userInfo;                
                response.lastAction = {"response":response, "fullPhrase":fullPhrase};
                
                if(!(response.response in this.jnervesystem)){
                    finalResponse.jresponse = "I feel like you were close to asking me something, you may be missing something when you mentioned '" + response.action+"'. ";
                    callback(finalResponse);
                }
                else {
                    this.jnervesystem[response.response](response, function(finalRes){ callback(finalRes); });
                }
            }
        }
        catch(ex){
            log.error("calling data response: " + ex);
            callback({"jresponse": "Somthing went wrong sorry (E1)"})
        }
    }
}

module.exports = JLANGUAGE;


function offlineGet(type, wordlist){
    var ret = [];
    try {
        let basedFile = fs.readFileSync(process.env.CONFIG_LOC +'/basedb.json');
        let baseDb = JSON.parse(basedFile);

        switch(type){
            case "search":
                ret = baseDb.phrases.filter(function(p){
                    var c1 = !p.type || p.type != "phrase";
                    var c2 = wordlist.includes(p.action);
                    var c3 = p.additional_phrases && p.additional_phrases.some(function(ap) { return wordlist.includes(ap);});

                    return c1 && (c2 || c3);
                });
                break;
            case "full":
                ret = baseDb.phrases.filter(function(p){ return p.type == "phrase"; });
                break;
            case "all":
                ret = baseDb.phrases;
                break;
            default:
                break;
        }
    }
    catch(ex){
        log.error("getting offline search: " + ex);
    }
    return ret;
}

function chopPhrase(action, phrase) {
    try {
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
    catch(ex){
        log.error("chopping phrase: " + ex);
        return "";
    }    
}

function emptyCheck(val) {
    return (val == undefined || val == '' || val == null);
}