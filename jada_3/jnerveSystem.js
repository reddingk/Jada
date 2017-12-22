'use strict';
/*
 * JADA NERVE SYSTEM CLASS
 * By: Kris Redding
 */

var fs = require('fs');
var os = require('os');
var http = require('http');
var opn = require('opn');
var underscore = require('underscore');
var md5 = require('md5');

const Tools = require('./jtools.js');
const Cells = require('./jcell.js');

class JNERVESYSTEM {
    constructor(innerBrain){
        this.jbrain = innerBrain;
        this.jtools = new Tools();
        this.jcell = new Cells();
        this.greetPhrases = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today", "How's life", "How's your day treating you {0}"];
    }

    /* Greetings */
    greetings(response, callback){
        var self = this;

        var tmpStr = response.fullPhrase.split(" ");
        var actionResponse = null;
        var removables = response.additional_phrases;
        removables.push(response.action);
        removables.push("Jada");

        var num = Math.floor((Math.random() * (self.greetPhrases.length)));
        var persGreeting = self.jtools.stringFormat(self.greetPhrases[num], [response.obj.name.nickname]);
        
        // Remove Greetings from phrase
        for(var i =0 ; i < removables.length; i++){
            var index = tmpStr.indexOf(removables[i]);
            if(index > -1) {
                tmpStr.splice(index,1).join(" ");
            }
        }

        if(tmpStr.length == 0) {
            callback({ "todo":"", "jresponse": persGreeting, "japi": {"results":persGreeting } });
        }
        else if(tmpStr == 1) {
            self.jbrain.convo(tmpStr[0], function(res){
              var finalResponse = persGreeting + ": " + res.jresponse;
              callback({ "todo":"", "jresponse": finalResponse, "japi": {"results":res.japi } });
            });
        }
        else {
            self.jbrain.convo(tmpStr.join(" "), function(res){
              var finalResponse = persGreeting + ": " + res.jresponse;
              callback({ "todo":"", "jresponse": finalResponse, "japi": {"results":res.japi } });
            });
        }
    }

    /* Get Local Time */
    getLocalTime(response, callback){
        var self = this;   
        self.jcell.getLocalDateTime({"type":"time"},
            function(res){
                var finalResponse = null;
                if(res.error == null && res.results != null){
                    var timeRes = res.results;
                    finalResponse = self.jtools.stringFormat("The time according to this machine is {0}", [timeRes]);
                }
                else {
                    finalResponse = "There was an error while retrieving the time, sorry check back later.";
                }
                callback({"jresponse": finalResponse});
        });    
    }

    /* Get Local Date*/
    getLocalDate(response, callback){
        var self = this;   
        self.jcell.getLocalDateTime({"type":"date"}, function(res){
            var finalResponse = null;
            if(res.error == null){
                var timeRes = res.results;
                finalResponse = self.jtools.stringFormat("The date according to this machine is {0}", [timeRes]);
            }
            else {
                finalResponse = "There was an error while retrieving the time, sorry check back later.";
            }
            callback({"jresponse": finalResponse});
        });    
    }

    /* Get TasteKid Results */
    getTastekidResults(response, callback){
        var self = this;
        var objectList = ["media","books","movies","music","shows","games","authors"];
        var dataObj = {"type":"all", "query":"", "limit":10, "info":0};

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
                            dataObj.limit = parseInt(preObject[j]);
                            break;
                        }
                    }
                }
                break;
            }
        }
        
        // Call API
        self.jcell.mediaCompare(dataObj, function(res){
            var finalResponse = null;
            if(res.error == null && res.results != null){
                if(res.results.Similar.Results.length == 0){
                    finalResponse = "Sorry there are no media suggestions for " + res.results.Similar.Info.map(function(el){ return el.Name; }).join(";") + ", maybe you have the wrong title(s)?";
                }
                else {
                    var inputString = res.results.Similar.Info.map(function(el){ return self.jtools.stringFormat("{0} ({1})", [el.Name, el.Type]); }).join(" & ");
                    var resultsString = res.results.Similar.Results.map(function(el){ return self.jtools.stringFormat("{0} ({1})", [el.Name, el.Type]); }).join(", ");

                    finalResponse = self.jtools.stringFormat("According to Tastekid for {0}. The following are sugguested that you checkout: {1}", [inputString, resultsString]);
                }
            }
            else {
                finalResponse = "There was an error while retrieving media compare data: " + res.error;
            }
            callback({"jresponse": finalResponse});
        });
    }

    /* Get Current Weather */
    getWeatherCurrent(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"find"};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("weather"));
        var forIndex = postPhrase.indexOf("for");

        if(forIndex >= 0){
            dataObj.location = postPhrase.slice(forIndex+1).join(" ");
            
            self.jcell.weatherInfo(dataObj, function(res){                 
                if(res.error == null && res.results != null){
                    if(res.results.count > 0) {
                        finalResponse = self.jtools.stringFormat("The current weather accourding to OpenWeather.com for {0} is: Tempurature of {1}, Humidity of {2}%, with a description of '{3}'", [res.results.list[0].name, res.results.list[0].main.temp, res.results.list[0].main.humidity, res.results.list[0].weather[0].description ]);
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Sorry we could not find the current weather for: {0}", [dataObj.location]);
                    }
                }
                else {
                    finalResponse = "There was an error while retrieving current weather data: " + res.error;
                }
                callback({"jresponse": finalResponse});
            });
        }
        else {
            finalResponse = "Im not sure where you would like me to look";
            callback({"jresponse": finalResponse});
        }
    }

    /* Get Weather Forecast */
    getWeatherForecast(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"forecast"};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("forecast"));
        var forIndex = postPhrase.indexOf("for");

        if(forIndex >= 0){
            dataObj.location = postPhrase.slice(forIndex+1).join(" ");
            
            self.jcell.weatherInfo(dataObj, function(res){                 
                if(res.error == null && res.results != null){                   
                    if(res.results.list.length > 0) {                        
                        // Set initial parameters
                        var dateString = (new Date(res.results.list[0].dt_txt)).toDateString();
                        var dateNum = 0;
                        var avgTemp = 0;
                        var avgStatus = {}; 
                        var dateList = [];                        

                        for(var i =0; i < res.results.list.length; i++){
                            var item = res.results.list[i];
                            var newDate = (new Date(item.dt_txt)).toDateString();
                            if(newDate != dateString ) {
                                var dateStatus = {"name":null, "count": 0};     
                                var lrgObj = Object.keys(avgStatus).reduce(function(a, b){ return avgStatus[a] > avgStatus[b] ? a : b });
                                
                                if(lrgObj != null){
                                    dateStatus.name = lrgObj;
                                    dateStatus.count = avgStatus[lrgObj];
                                }
                                dateList.push(self.jtools.stringFormat(" |{0} : {1} degrees and '{2}'", [dateString, (avgTemp / dateNum).toFixed(2), dateStatus.name]));

                                //Reset tmp Values
                                dateString = newDate;
                                avgTemp = 0;                                
                                dateNum = 0;
                                avgStatus = {};
                            }
                            else{
                                dateNum +=1.0;
                                avgTemp += parseFloat(item.main.temp_max);
                                if(item.weather[0].main in avgStatus){
                                    avgStatus[item.weather[0].main] += 1;
                                }
                                else {
                                    avgStatus[item.weather[0].main] = 1;
                                }
                            }
                        } 
                        
                        finalResponse = self.jtools.stringFormat("The weather forecast for the next few days accourding to OpenWeather.com for {0}: \n {1}",[res.results.city.name, dateList.join("\n")]);
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Sorry we could not find the weather forecast for: {0}", [dataObj.location]);
                    }
                }
                else {
                    finalResponse = "There was an error while retrieving current weather data: " + res.error;
                }
                callback({"jresponse": finalResponse});
            });
        }
        else {
            finalResponse = "Im not sure where you would like me to look";
            callback({"jresponse": finalResponse});
        }
    }
}


module.exports = JNERVESYSTEM;