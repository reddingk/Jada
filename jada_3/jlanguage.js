'use strict';

/*
 * JADA LANGUAGE CLASS
 * By: Kris Redding
 */

var underscore = require('underscore');
var fs = require('fs');
var database = require('./config/database');
var mongoClient = require('mongodb').MongoClient;

const Tools = require('./jtools.js');
const basedb = require("./config/basedb.json");

class JLANGUAGE {
    constructor(){
        this.phraseLib = [];
        this.fullPhraseLib = null;
        this.mongoOptions = { connectTimeoutMS: 2000, socketTimeoutMS: 2000};
        this.jTools = new Tools();
    }

    /* Functions */
    cleanPhrase(phrase) {
        var tmpPhrase = phrase.toLowerCase();
        return tmpPhrase;
    }

    getPhrases(callback) {
        var self = this;

        try{
            mongoClient.connect(database.remoteUrl, self.mongoOptions, function(err, client){ 
                if(err) {
                    //console.log(" Debug: Error Get All Phrases");
                    callback(self.offlineGet("all", []));
                }
                else {
                    if(this.phraseLib == null || this.phraseLib.length == 0){
                        console.log(" > Getting Phrases From DB");
                        const db = client.db(database.dbName).collection('phrases');
                        collection.find().toArray(function(err, res){
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
            });
        }  
        catch(ex){
            //callback(null);
        }
    }
    getFullPhrases(callback){
        var self = this;

        try {
            mongoClient.connect(database.remoteUrl, self.mongoOptions, function(err, client){
                if(err) {
                    //console.log(" Debug: Error Get Full Phrase");
                    callback(self.offlineGet("full", []));
                }
                else {
                    if(self.fullPhraseLib == null) {
                        console.log(" > Getting Full Phrases From DB");
                        const db = client.db(database.dbName).collection('phrases');
                        db.find({ 'type' : 'phrase' }).toArray(function(err, res){
                            if(res == null|| res == undefined) { res = [];}
                            callback(res);
                        });                       
                    }
                    else {
                        callback(self.fullPhraseLib);
                    }
                }
            });
        }  
        catch(ex){
            //callback(null);
        }
    }

    searchPhrase(wordList, callback) {
        var self = this;
        try {
            mongoClient.connect(database.remoteUrl, self.mongoOptions, function(err, client){
                if(err) {
                    //console.log(" Debug: Error Search Phrase");
                    callback(self.offlineGet("search", wordList));
                }
                else {  
                    const db = client.db(database.dbName).collection('phrases');
                    /* Find all that
                     * Not Phrase &&
                     * [action in wordlist || additional_phrases in wordlist]
                     */

                    db.find({'$and': [
                        {'type': { '$ne': 'phrase' }},
                        {'$or': [
                        {'action': {'$in': wordList}},
                        {'additional_phrases': {'$elemMatch': {'$in': wordList}}}
                        ]}
                    ]}).toArray(function(err, res){
                        if(res == null || res == undefined) { res = [];}
                        callback(res);
                    });
                }
            });
        }  
        catch(ex){
            //callback(null);
        } 
    }


    /* PRIVATE FUNCTIONS */

    /* Offline Get */
    offlineGet(type, wordlist){
        var self = this;
        var res = [];

        try {

            switch(type){
                case "search":
                    var q1 = underscore.reject(basedb.phrases, function(p){ return p.type == 'phrase'});
                    var q2 = underscore.filter(q1, function(p){ return wordlist.includes(p.action); });
                    var q3 = underscore.filter(q1, function(p){ return p.additional_phrases && p.additional_phrases.some(function(ap) { return wordlist.includes(ap);}); });

                    res = q2.concat(q3); 
                    break;
                case "full":
                    res = underscore.where(basedb.phrases, {type: "phrases"});
                    break;
                case "all":
                    res = basedb.phrases;
                    break;
                default:
                    break;
            }
        }
        catch(ex){
            console.log("Error with offline search: ", ex);
        }
        return res;
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
            console.log(" > Error Processing Language [jl0]", ex);
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

