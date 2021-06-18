'use strict';

/*
 * JADA NERVE SYSTEM CLASS
 * By: Kris Redding
 */

require('dotenv').config();
const log = require('../server/services/log.service');
const fs = require('fs');

const Tools = require('./jtools.js');
const Cells = require('./jcell.js');

class JNERVESYSTEM {
    constructor(innerBrain){
        this.jbrain = innerBrain;
        this.jtools = new Tools();
        this.jcell = new Cells();
    }

    default(response, callback){
        var self = this, finalResponse = null;
        try {
            //response.userInfo,
        }
        catch(ex){
            log.error("in default: " + ex);
            callback({"jresponse":"Issue with default, sorry"});
        }
    }

    /* Greetings */
    greetings(response, callback){
        var self = this;
        try {
            let basedFile = fs.readFileSync(process.env.CONFIG_LOC +'/basedb.json');
            let baseDb = JSON.parse(basedFile);

            var num = Math.floor((Math.random() * (baseDb.greetings.length)));
            var persGreeting = this.jtools.stringFormat(baseDb.greetings[num], [response.userInfo.nickname])
            
            var removables = response.additional_phrases;
            removables.push(response.action); removables.push("jada");

            // Remove Greetings from phrase
            var tmpStr = response.fullPhrase.split(" ");  
            for(var i = 0 ; i < removables.length; i++){
                var index = tmpStr.indexOf(removables[i]);
                if(index > -1) {
                    tmpStr.splice(index,1).join(" ");
                }
            }

            if(tmpStr.length == 0) {
                callback({ "jresponse": persGreeting, "jtype":"greeting", "jdata": {"results":persGreeting } });
            }
            else {
                self.jbrain.convo(tmpStr.join(" "), response.userInfo, function(res){
                  var finalResponse = persGreeting + ": " + res.jresponse;
                  callback({ "jresponse": finalResponse, "jtype":"greeting", "jdata": {"results":res.jdata } });
                });
            }
        }
        catch(ex){
            log.error("in greetings: " + ex);
            callback({"jresponse":"Issue with greeting sorry"});
        }
    }

    /* Get Local Time */
    getLocalTime(response, callback){
        var self = this;
        try {
            this.jcell.getLocalDateTime({"type":"time"}, response.userInfo,
                function(res){
                    var finalResponse = null, timeRes = 0;
                    if(res.error == null && res.results != null){
                        timeRes = res.results;
                        finalResponse = self.jtools.stringFormat("The time according to this machine is {0}", [timeRes]);
                    }
                    else {
                        finalResponse = "There was an error while retrieving the time, sorry check back later.";
                    }
                    callback({"jresponse": finalResponse, "jtype":"time", "jdata":timeRes});
            });    
        }
        catch(ex){
            log.error("in local time: " + ex);
            callback({"jresponse":"Issue with getting local time, sorry"});
        }
    }

    /* Get Local Date*/
    getLocalDate(response, callback){
        var self = this;
        try {
            self.jcell.getLocalDateTime({"type":"date"}, response.userInfo, function(res){
                var finalResponse = null, timeRes = 0;
                if(res.error == null){
                    timeRes = res.results;
                    finalResponse = self.jtools.stringFormat("The date according to this machine is {0}", [timeRes]);
                }
                else {
                    finalResponse = "There was an error while retrieving the time, sorry check back later.";
                }
                callback({"jresponse": finalResponse, "jtype":"date", "jdata":timeRes});
            });    
        }
        catch(ex){
            log.error("in getting local date: " + ex);
            callback({"jresponse":"Issue with getting local date, sorry"});
        }
    }

    /* Get Map Countries By Continent */
    getMapCountriesByContinent(response, callback){
        var self = this, finalResponse = null;

        try {
            var tmpPhrase = response.fullPhrase.split(" ");
            var contriesIndex = tmpPhrase.indexOf("countries");

            if((tmpPhrase.length - (contriesIndex + 1)) < 2){
                callback({"jresponse":"Error figuring out where you want me to search for capitals"});
            }
            else {
                var postPhrase = tmpPhrase.slice(contriesIndex+2);
                var cellData = {"location":postPhrase.join(" "), "userId": response.userId};
    
                self.jcell.getMapCountriesByContinent(cellData, response.userInfo, function(res){
                    if(res.error){
                        finalResponse = "Sorry error getting results";
                    }
                    else {                    
                        var countryList = res.results.map(item => (item.name+":"+item.countryCode));
                        finalResponse = "Here is the continent information that I found: " + countryList.join(", ");                    
                    }
                    callback({"jresponse": finalResponse, "jdata":res, "jtype":"map"});
                });
            }
        }
        catch(ex){
            log.error("in Getting Map Countries By Continent: " + ex);
            callback({"jresponse":"Issue with Getting Map Countries By Continent, Sorry"});
        }
    }

    /* Get Map Capitals */
    getMapCapital(response, callback){
        var self = this, finalResponse = null;
        try {
            /* Parse Phrase */
            var tmpPhrase = response.fullPhrase.split(" ");
            var capitalIndex = tmpPhrase.indexOf("capital");
            var capitalsIndex = tmpPhrase.indexOf("capitals");

            var capIndex = (capitalIndex > 0 ? capitalIndex : capitalsIndex);
            var isStates = false;
            
            if(capIndex > 0 && tmpPhrase[capIndex -1] == "state") { isStates = true;}

            if((tmpPhrase.length - (capIndex+1)) < 2){
                callback({"jresponse":"Error figuring out where you want me to get capitals"});
            }
            else {
                var postPhrase = tmpPhrase.slice(capIndex+2);
                var cellData = {"location":postPhrase.join(" "), "isState":isStates, "userId": response.userId};
                self.jcell.getMapCapital(cellData, response.userInfo, function(res){                    
                    if(res.error){
                        finalResponse = "Sorry error getting results";
                    }
                    else {
                        if(isStates){
                            var capList = [];
                            // Parse state list
                            for(var i =0; i < res.results.length; i++){                         
                                capList.push(res.results[i].name + ":" + res.results[i].capital.name);
                            }
                            finalResponse = "Here is the capital information that I found: " + capList.join(" "); 
                        }
                        else {
                            var stateList = res.results.map(item => (item.name+":"+item.capital.name+":"+item.countryCode));
                            finalResponse = "Here is the capital information that I found: " + stateList.join(", ");
                        }
                    }
                    callback({"jresponse": finalResponse, "jdata":res, "jtype":"map"});
                });
            }     
        }
        catch(ex){
            log.error("in getMapCapital: " + ex);
            callback({"jresponse":"Issue with Getting Map Capital, sorry"});
        }
    }

    /* Get TasteKid Results */
    getTastekidResults(response, callback){
        var self = this, finalResponse = null;
        try {
            var objectList = ["media","books","movies","music","shows","games","authors"];
            var dataObj = {"type":"all", "query":"", "limit":10, "info":0, "userId": response.userId};
            
            // Parse phrase
            for(var i=0; i < objectList.length; i++){
                var objectPos = response.fullPhrase.indexOf(objectList[i]);
                var simPos = response.fullPhrase.indexOf("similar to");
                if((objectPos >= 0 && simPos > 0) && objectPos < simPos){
                    dataObj.query = response.fullPhrase.substring(simPos + 11);
                    dataObj.type = objectList[i];

                    // check for results limit in phrase
                    if(objectPos > 0){
                        var preObject = response.fullPhrase.substring(0,objectPos).split(" ");
                        for(var j=0; j < preObject.length ; j++){
                            if(!isNaN(parseInt(preObject[j]))){
                                dataObj.limit = parseInt(preObject[j]); break;
                            }
                        }
                    }
                    break;
                }
            }
            
            // Call API
            self.jcell.mediaCompare(dataObj, response.userInfo, function(res){
                var finalResponse = null;
                var resultsString = null;
                if(res.error == null && res.results != null){
                    if(res.results.Similar.Results.length == 0){
                        finalResponse = "Sorry there are no media suggestions for " + res.results.Similar.Info.map(function(el){ return el.Name; }).join(";") + ", maybe you have the wrong title(s)?";
                    }
                    else {
                        var inputString = res.results.Similar.Info.map(function(el){ return self.jtools.stringFormat("{0} ({1})", [el.Name, el.Type]); }).join(" & ");
                        resultsString = res.results.Similar.Results.map(function(el){ return self.jtools.stringFormat("{0} ({1})", [el.Name, el.Type]); }).join(", ");

                        finalResponse = self.jtools.stringFormat("According to Tastekid for {0}. The following are sugguested that you checkout: {1}", [inputString, resultsString]);
                    }
                }
                else {
                    finalResponse = "There was an error while retrieving media compare data: " + res.error;
                }
                callback({"jresponse": finalResponse,  "jtype":"media", "jdata":res.results.Similar});
            });
        }
        catch(ex){
            log.error("in getTastekidResults: " + ex);
            callback({"jresponse":"Issue with Getting Tastekid Results, sorry"});
        }
    }
}

module.exports = JNERVESYSTEM;