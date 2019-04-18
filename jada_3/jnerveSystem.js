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
//const Eyes = require('./jeyes.js');
const basedb = require("./config/basedb.json");

class JNERVESYSTEM {
    constructor(innerBrain){
        this.jbrain = innerBrain;
        this.jtools = new Tools();
        this.jcell = new Cells(innerBrain.settingFile);
        //this.jeyes = new Eyes();
        this.greetPhrases = basedb.greetings;
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
            callback({ "todo":"", "jresponse": persGreeting, "jdata": {"results":persGreeting } });
        }
        else if(tmpStr == 1) {
            self.jbrain.convo(tmpStr[0], function(res){
              var finalResponse = persGreeting + ": " + res.jresponse;
              callback({ "todo":"", "jresponse": finalResponse, "jdata": {"results":res.jdata } });
            });
        }
        else {
            self.jbrain.convo(tmpStr.join(" "), function(res){
              var finalResponse = persGreeting + ": " + res.jresponse;
              callback({ "todo":"", "jresponse": finalResponse, "jdata": {"results":res.jdata } });
            });
        }
    }

    /* Get Local Time */
    getLocalTime(response, callback){
        var self = this;   
        self.jcell.getLocalDateTime({"type":"time"},
            function(res){
                var finalResponse = null;
                var timeRes = 0;
                if(res.error == null && res.results != null){
                    timeRes = res.results;
                    finalResponse = self.jtools.stringFormat("The time according to this machine is {0}", [timeRes]);
                }
                else {
                    finalResponse = "There was an error while retrieving the time, sorry check back later.";
                }
                callback({"jresponse": finalResponse, "jdata":timeRes});
        });    
    }

    /* Get Local Date*/
    getLocalDate(response, callback){
        var self = this;   
        self.jcell.getLocalDateTime({"type":"date"}, function(res){
            var finalResponse = null;
            var timeRes = 0;
            if(res.error == null){
                timeRes = res.results;
                finalResponse = self.jtools.stringFormat("The date according to this machine is {0}", [timeRes]);
            }
            else {
                finalResponse = "There was an error while retrieving the time, sorry check back later.";
            }
            callback({"jresponse": finalResponse, "jdata":timeRes});
        });    
    }
    /* Get Map Countries By Continent */
    getMapCountriesByContinent(response, callback){
        var self = this;
        var finalResponse = null;

        var tmpPhrase = response.fullPhrase.split(" ");
        var contriesIndex = tmpPhrase.indexOf("countries");

        if((tmpPhrase.length - (contriesIndex+1)) < 2){
            callback({"jresponse":"Error figuring out where you want me to get capitals"});
        }
        else {
            var postPhrase = tmpPhrase.slice(contriesIndex+2);
            var cellData = {"location":postPhrase.join(" ")};

            self.jcell.getMapCountriesByContinent(cellData, function(res){
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

    /* Get Map Capitals */
    getMapCapital(response, callback){
        var self = this;
        var finalResponse = null;

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
            var cellData = {"location":postPhrase.join(" "), "isState":isStates};
            self.jcell.getMapCapital(cellData, function(res){
                
                if(res.error){
                    finalResponse = "Sorry error getting results";
                }
                else {
                    if(isStates){
                        var capList = [];
                        // Parse state list
                        for(var i =0; i < res.results.length; i++){
                            var countryStates = [];
                            for(var j =0; j < res.results[i].states.length; j++){
                                countryStates.push(res.results[i].states[j].name+":"+res.results[i].states[j].capital.name);
                            }
                            capList.push(res.results[i].name + " | " + countryStates.join(", "));
                        }
                        finalResponse = "Here is the capital information that I found: " + capList.join(" "); 
                    }
                    else {
                        var stateList = res.results.map(item => (item.name+":"+item.capital.name+":"+item.countryCode+":"+item.type));
                        finalResponse = "Here is the capital information that I found: " + stateList.join(", ");
                    }
                }
                callback({"jresponse": finalResponse, "jdata":res, "jtype":"map"});
            });
        }     
    }
    /* Get Sports Schedules */
    getSportsSchedule(response,callback){
        var self = this;

        /* Parse Phrase */
        var tmpPhrase = response.fullPhrase.split(" ");
        var scheduleIndex = tmpPhrase.indexOf("schedule");

        var postPhrase = tmpPhrase.slice((scheduleIndex > 0 ? scheduleIndex -1:0));

        scheduleIndex = postPhrase.indexOf("schedule");
        var forIndex = self.additionalPhraseSlicers(postPhrase, ["for"]);
        var weekIndex = self.additionalPhraseSlicers(postPhrase, ["week"]);
        weekIndex = (weekIndex < 0 ? forIndex+1 : weekIndex);
        
        var sportsVal = (scheduleIndex > 0 ? scheduleIndex-1 : -1);
        var weekVal = (weekIndex < postPhrase.length ? weekIndex : 0);

        if(sportsVal < 0){
            callback({"jresponse":"Error figuring out what sport to get schedule for"});
        }
        else {
            var cellData = {"sport":postPhrase[sportsVal], "day_week":postPhrase[weekVal]};
            /* Request */
            self.jcell.getSportsSchedule(cellData, function(res){
                var schFeedback = "";
                if(res.error){
                    schFeedback = res.error;
                }
                else {
                    for(var i=0; i < res.results.length; i++){
                        schFeedback += res.results[i].day + ": ";
                        for(var j=0; j < res.results[i].games.length; j++){
                            schFeedback += "\n -" + res.results[i].games[j].awayTeam + " at " + res.results[i].games[j].homeTeam + " : " + res.results[i].games[j].gameInfo;
                        }
                        schFeedback += "\n";
                    }
                }

                callback({"jresponse": schFeedback, "jdata":res.results});
            });
        }
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
            callback({"jresponse": finalResponse, "jdata":res.results.Similar});
        });
    }

    /* Get Current Weather */
    getWeatherCurrent(response, callback){
        var self = this;
        var finalResponse = null;
        var apiResponse = null;
        var dataObj = {"type":"find"};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("weather"));
        var forIndex = self.additionalPhraseSlicers(postPhrase, ["for", "in"]);        

        if(forIndex >= 0){
            dataObj.location = postPhrase.slice(forIndex+1).join(" ");
            
            self.jcell.weatherInfo(dataObj, function(res){                 
                if(res.error == null && res.results != null){
                    if(res.results.count > 0) {
                        finalResponse = self.jtools.stringFormat("The current weather accourding to OpenWeather.com for {0} is: Tempurature of {1}, Humidity of {2}%, with a description of '{3}'", [res.results.list[0].name, res.results.list[0].main.temp, res.results.list[0].main.humidity, res.results.list[0].weather[0].description ]);
                        apiResponse = res.results.list[0];
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Sorry we could not find the current weather for: {0}", [dataObj.location]);
                    }
                }
                else {
                    finalResponse = "There was an error while retrieving current weather data: " + res.error;
                }
                callback({"jresponse": finalResponse, "jdata":apiResponse });
            });
        }
        else {
            finalResponse = "Im not sure where you would like me to look";
            callback({"jresponse": finalResponse, "jdata":apiResponse});
        }
    }

    /* Get Weather Forecast */
    getWeatherForecast(response, callback){
        var self = this;
        var finalResponse = null;
        var apiResponse = null;
        var dataObj = {"type":"forecast"};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("forecast"));
        var forIndex = self.additionalPhraseSlicers(postPhrase, ["for", "in"]); 

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
                                dateList.push(self.jtools.stringFormat("{0} : {1} degrees and '{2}'", [dateString, (avgTemp / dateNum).toFixed(2), dateStatus.name]));

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
                        
                        finalResponse = self.jtools.stringFormat("The weather forecast for the next few days accourding to OpenWeather.com for {0}: \n {1}",[res.results.city.name, dateList.join("\n | ")]);
                        apiResponse = dateList;
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Sorry we could not find the weather forecast for: {0}", [dataObj.location]);
                    }
                }
                else {
                    finalResponse = "There was an error while retrieving current weather data: " + res.error;
                }
                callback({"jresponse": finalResponse, "jdata":apiResponse});
            });
        }
        else {
            finalResponse = "Im not sure where you would like me to look";
            callback({"jresponse": finalResponse, "jdata":apiResponse});
        }
    }

    /* Get Detailed Weather Forecast */
    getWeatherDetailedForecast(response, callback){
        var self = this;
        var finalResponse = null;
        var apiResponse = null;
        var dataObj = {"type":"forecast"};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("details"));
        var forIndex = self.additionalPhraseSlicers(postPhrase, ["for", "in"]); 

        if(forIndex >= 0){
            dataObj.location = postPhrase.slice(forIndex+1).join(" ");
            
            self.jcell.weatherInfo(dataObj, function(res){                 
                if(res.error == null && res.results != null){                   
                    if(res.results.list.length > 0) {  
                        var dateString = "";
                        finalResponse = self.jtools.stringFormat("The weather forecast for the next few days accourding to OpenWeather.com for {0}: ",[res.results.city.name]);
                        apiResponse = res.results.list;

                        for(var i =0; i < res.results.list.length; i++){
                            var item = res.results.list[i];
                            var newDate = new Date(item.dt_txt);
                            if(newDate.toDateString() != dateString ){
                                dateString = newDate.toDateString();
                                finalResponse += self.jtools.stringFormat("\n\n|{0}\n [{1}]: {2} degrees and '{3}' ", [dateString, newDate.toLocaleTimeString(), item.main.temp_max, item.weather[0].description]);

                            }
                            else {
                                finalResponse += self.jtools.stringFormat("\n [{0}]: {1} degrees and '{2}' ", [newDate.toLocaleTimeString(), item.main.temp_max, item.weather[0].description]);
                            }
                        }
                        finalResponse += "\n";
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Sorry we could not find: {0} maybe you spelled it wrong?", [dataObj.location]);
                    }
                }
                else {
                    finalResponse = "There was an error while retrieving current weather data: " + res.error;
                }
                callback({"jresponse": finalResponse, "jdata":apiResponse});
            });
        }
        else {
            finalResponse = "Im not sure where you would like me to look";
            callback({"jresponse": finalResponse, "jdata":apiResponse});
        }
    }

    /* Change full name */
    changeFullName(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"item":"fullname", "newitem":null};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("my"));
        var forIndex = postPhrase.indexOf("to");

        try {
            if(forIndex >= 0){
                dataObj.newitem = postPhrase.slice(forIndex+1).join(" ");

                self.jcell.getChangedSetting(dataObj, function(res){  
                    if(res.error == null && res.results != null){
                        finalResponse = self.jtools.stringFormat("I {0} '{1}' to {2}",[(res.results.updated == true ? "Successfully Updated" : "Couldn't Update"), res.results.item, res.results.newitem]);
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Error Updating User Settings: {0}", [res.error]);
                    }
                    callback({"jresponse": finalResponse});
                });
            }
        }
        catch(ex){
            finalResponse = "Error changing fullName: " + ex;
            callback({"jresponse": finalResponse});
        }
    }

    /* Change nickname */
    changeNickname(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"item":"nickname", "newitem":null};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("my"));
        var forIndex = postPhrase.indexOf("to");

        try {
            if(forIndex >= 0){
                dataObj.newitem = postPhrase.slice(forIndex+1).join(" ");

                self.jcell.getChangedSetting(dataObj, function(res){  
                    if(res.error == null && res.results != null){
                        finalResponse = self.jtools.stringFormat("I {0} '{1}' to {2}",[(res.results.updated == true ? "Successfully Updated" : "Couldn't Update"), res.results.item, res.results.newitem]);
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Error Updating User Settings: {0}", [res.error]);
                    }
                    callback({"jresponse": finalResponse});
                });
            }
        }
        catch(ex){
            finalResponse = "Error changing fullName: " + ex;
            callback({"jresponse": finalResponse});
        }
    }

    /* Change voice settings */
    changeVoice(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"item":"voice", "newitem":null};

        var tmpPhrase = response.fullPhrase.split(" ");
        var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("my"));
        var forIndex = postPhrase.indexOf("to");

        try {
            if(forIndex >= 0){
                dataObj.newitem = postPhrase.slice(forIndex+1).join(" ");

                self.jcell.getChangedSetting(dataObj, function(res){  
                    if(res.error == null && res.results != null){
                        finalResponse = self.jtools.stringFormat("I {0} '{1}' to {2}",[(res.results.updated == true ? "Successfully Updated" : "Couldn't Update"), res.results.item, res.results.newitem]);
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Error Updating User Settings: {0}", [res.error]);
                    }
                    callback({"jresponse": finalResponse});
                });
            }
        }
        catch(ex){
            finalResponse = "Error changing fullName: " + ex;
            callback({"jresponse": finalResponse});
        }
    }

    /* get directions */
    getDirections(response, callback){
        var self = this;
        var finalResponse = null;
        var apiResponse = null;
        var dataObj = {};               

        try {
            var tmpPhrase = response.fullPhrase.split(" ");
            var dircIndex = tmpPhrase.indexOf("directions");
            dataObj.type = ( dircIndex > 0 ? tmpPhrase[dircIndex - 1] : "driving");

            var postPhrase = tmpPhrase.slice(dircIndex);
            var fromIndex = postPhrase.indexOf("from") + 1;
            var toIndex = postPhrase.indexOf("to") + 1;
            
            if(fromIndex > -1 && toIndex > -1){
                var tmpFrom = (fromIndex < toIndex ? postPhrase.slice(fromIndex, toIndex-1) : postPhrase.slice(fromIndex));
                var tmpTo = (fromIndex < toIndex ? postPhrase.slice(toIndex) : postPhrase.slice(toIndex, fromIndex-1));

                dataObj.fromLoc = tmpFrom.join(" ");
                dataObj.toLoc = tmpTo.join(" ");                
                dataObj.type = (dataObj.type == "transit" ? "transit" :"driving");                

                self.jcell.getDirections(dataObj, function(res){
                    if(res.error == null && res.results != null && res.results.status == "OK"){
                        var legs = res.results.routes[0].legs[0];
                        var resultList = [];
                        
                        apiResponse = legs;
                        resultList.push(self.jtools.stringFormat("It will take approximately {0} and {1} from '{2}' to '{3}': ", [legs.duration.text, legs.distance.text, legs.start_address, legs.end_address]));
                        for(var i in legs.steps){
                            var step = legs.steps[i];
                            resultList.push(self.jtools.stringFormat(" ({0} : {1}) {2}",[step.distance.text, step.duration.text, step.html_instructions.replace(/<(.|\n)*?>/g, '')]));
                        }
                        finalResponse = resultList.join("\n\n");
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("Error Retrieving Directions: {0}", [res.error]);
                    }
                    callback({"jresponse": finalResponse, "jdata":apiResponse});
                });
            }
            else {
                finalResponse = "Sorry I was not able to get the directions for you";
                callback({"jresponse": finalResponse, "jdata":apiResponse});
            }
        }
        catch(ex){
            finalResponse = "Sorry there was an error while getting the directions for you: " + ex;
            callback({"jresponse": finalResponse, "jdata":apiResponse});
        }
    }

    /* Get Server CPU Arch */
    getCpuArch(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"arch"};

        try {                          
            self.jcell.getOSInfo(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    finalResponse = self.jtools.stringFormat("the cpu architecture is {0}",[res.results]);
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving CPU ARCH: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata": res.results});
            });            
        }
        catch(ex){
            finalResponse = "Error retrieving CPU ARCH: " + ex;
            callback({"jresponse": finalResponse, "jdata": null});
        }
    }

    /* Get Server CPU Info */
    getCpuInfo(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"info"};

        try {                          
            self.jcell.getOSInfo(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    var cores = res.results;

                    finalResponse = self.jtools.stringFormat("You have {0} cores on this machine, they are the following: ", [cores.length]);
                    for(var i =0; i < cores.length; i++)
                    { finalResponse += self.jtools.stringFormat("\n core {0}: {1}", [i, cores[i].model]);  }                    
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving CPU INFO: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });            
        }
        catch(ex){
            finalResponse = "Error retrieving CPU INFO: " + ex;
            callback({"jresponse": finalResponse, "jdata":null});
        }
    }

    /* Get Server Computer Hostname */
    getComputerHostname(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"hostname"};

        try {                          
            self.jcell.getOSInfo(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    finalResponse = self.jtools.stringFormat("The computers hostname is {0}",[res.results]);
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving Computer Hostname: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });            
        }
        catch(ex){
            finalResponse = "Error retrieving Computer Hostname: " + ex;
            callback({"jresponse": finalResponse, "jdata":null});
        }
    }

    /* Get Server Network Interface */
    getNetworkInterface(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"networkinterface"};

        try {                          
            self.jcell.getOSInfo(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    var network = res.results;
                    var info = null;  
                    for(var i in network) {
                        for(var j in network[i]){
                            var iface = network[i][j];
                            if(iface.family == "IPv4" && !iface.internal) {
                                info = iface;
                                break;
                            }
                        }
                    }

                    finalResponse = (info != null ? self.jtools.stringFormat("network information address: {0}, netmask: {1}, mac: {2}", [info.address, info.netmask, info.mac]) : "Sorry no network information");
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving network information: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });            
        }
        catch(ex){
            finalResponse = "Error retrieving network information: " + ex;
            callback({"jresponse": finalResponse, "jdata":null});
        }
    }

    /* Get Server System Release */
    getSystemRelease(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"systemrelease"};

        try {                          
            self.jcell.getOSInfo(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    finalResponse = self.jtools.stringFormat("The operating system release is {0}",[res.results]);
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving system release: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });            
        }
        catch(ex){
            finalResponse = "Error retrieving system release: " + ex;
            callback({"jresponse": finalResponse, "jdata":null});
        }
    }

    /* Get Server System Memory */
    getSystemMemory(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":"systemmemory"};

        try {                          
            self.jcell.getOSInfo(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    var memory = res.results;
                    var memPhrase = "";
                    if(memory > 1073741824) { memPhrase = self.jtools.stringFormat("{0} GB", [(memory/1073741824).toFixed(3) ]); }
                    else if(memory > 1048576) { memPhrase = self.jtools.stringFormat("{0} MB", [(memory/1048576).toFixed(3) ]);  }
                    else if(memory > 1024) { memPhrase = self.jtools.stringFormat("{0} KB", [(memory/1024).toFixed(3) ]); }
                    else { memPhrase = self.jtools.stringFormat("{0} B",[memory]); }

                    finalResponse = self.jtools.stringFormat("The amount of avaliable memory for the system is {0}",[memPhrase]);
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving system memory: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });            
        }
        catch(ex){
            finalResponse = "Error retrieving system memory: " + ex;
            callback({"jresponse": finalResponse, "jdata":null});
        }
    }

    /* Easter Eggs */
    easterEggs(reponse, callback){
        var self = this;
        var finalResponse = null;

        try {
            switch(reponse.action){
                case "do you know the muffin man":
                  finalResponse = "yes, he lives in mulbery lane";                  
                  break;
                case "how are you":
                  // TODO: perform system diagnostic
                  finalResponse = "great thanks for asking";                  
                  break;
                default:                  
                  break;
              }              
        }
        catch(ex){
            finalResponse = "(-_-)";
        }
        callback({"jresponse": finalResponse});
    }

    /* Relationship Guide */
    relationshipGuide(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":null, "searchName":null};

        try {
            var tmpPhrase = response.fullPhrase.split(" ");
            var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(response.action)+1);
            if(postPhrase.indexOf("my") > -1){
                postPhrase = postPhrase.slice(postPhrase.indexOf("my")+1);
            }

            dataObj.type = (response.action == "am" ? "me" : (response.action == "is" || response.action == "are" ? "other" : null));
            if(dataObj.type == "other"){
                dataObj.searchName = postPhrase.join(" ").replace(/'s$/g, "");
            }

            self.jcell.getRelationships(dataObj, function(res){  
                if(res.error == null && res.results != null){
                    var relationships = res.results;

                    if(relationships.length > 0){
                        var relInfo = [];
                        for(var j =0; j < relationships.length; j++){
                            if(relationships[j].type == "me"){
                                relInfo.push(self.jtools.stringFormat("You are {0} aka {1}", [relationships[j].info.name, relationships[j].info.nickname]));
                            }
                            else if(relationships[j].type == "name"){
                                relInfo.push(Object.keys(relationships[j].info.title).join(","))
                            }
                            else {
                                relInfo.push(relationships[j].info.name);
                            }
                        }
                        if(dataObj.type == "me"){
                            finalResponse = relInfo.join("");
                        }
                        else {
                            finalResponse =  self.jtools.stringFormat("you told me your {0}{1} '{2}'", [dataObj.searchName, (relationships.length > 1 ? "'s are" :" is"), relInfo.join(",")]);
                        }
                    }
                    else {
                        finalResponse = self.jtools.stringFormat("sorry I don't think you told me about {0}.", [postPhrase.join(" ")]);
                    }
                }
                else {
                    finalResponse = "sorry you didn't give me a name or nickname I could work with.";
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });            
        }
        catch(ex){
            finalResponse = "error trying to find relationship: " + ex;
            callback({"jresponse": finalResponse, "jdata":null});
        }
    }

    /* Get Location information */
    locationGuide(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":null, "searchName":null};

        try {
            var tmpPhrase = response.fullPhrase.split(" ");
            var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(response.action)+1);
            if(postPhrase.indexOf("my") > -1){
                postPhrase = postPhrase.slice(postPhrase.indexOf("my")+1);
            }

            dataObj.searchName = postPhrase.join(" ");
            dataObj.type = (response.action == "am" ? "me" : (response.action == "is" ? "other" : null));

            self.jcell.getLocation(dataObj, function(res){
                if(res.error == null && res.results != null){
                    if(res.results.type == "me"){                        
                        finalResponse = self.jtools.stringFormat("You are currently located near {0}, {1}",[res.results.location.city, res.results.location.regionName]);
                    }
                    else {
                        if(res.results.location == null || res.results.location == undefined){
                            finalResponse = self.jtools.stringFormat("you never told me where {0} was located", [dataObj.searchName]);
                        }
                        else {
                            finalResponse = self.jtools.stringFormat("you told me the address for {0} is '{1}'", [res.results.location.name, res.results.location.address]);
                        }
                    }                    
                }
                else {
                    finalResponse = "Sorry: " + res.error;
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });

        }
        catch(ex){
            callback({"jresponse": "There seems to be an issue with my location guide: " + ex, "jdata":null});
        }
    }

    /* Add user data */
    addUserSetting(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":null, "info":{}};
        
        try {
            var tmpPhrase = response.fullPhrase.split(" ");
            var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(response.action)+1);

            dataObj.type = (response.action == "location" || response.action == "relationship"? response.action : null);
            if(dataObj.type == "location"){
                var asPos = postPhrase.indexOf("as");

                dataObj.info.name = postPhrase.slice(0, asPos).join(" ");
                dataObj.info.address = postPhrase.slice(asPos+1).join(" ");                
            }
            else if(dataObj.type == "relationship"){
                var myPos = postPhrase.indexOf("my");
                var isPos = postPhrase.indexOf("is");

                if(isPos > -1 && myPos > -1){
                    if(isPos < myPos){
                        dataObj.info.name = postPhrase.slice(0, isPos).join(" ");
                        dataObj.info.title = postPhrase.slice(myPos+1).join(" ");
                    }
                    else {
                        dataObj.info.name = postPhrase.slice(isPos+1).join(" ");
                        dataObj.info.title = postPhrase.slice(myPos+1, isPos).join(" ");
                    }
                }               
            }

            self.jcell.addUserSetting(dataObj, function(res){                    
                if(res.error == null && res.results != null){
                    if(res.results.type == "location"){
                        if(res.results.status == false){
                            finalResponse = self.jtools.stringFormat("I believe you already have an address for {0} which is {1}, if you would like me to change it just ask me to 'replace'", [res.results.data.name, res.results.data.address]);                                
                        }
                        else {
                            finalResponse = self.jtools.stringFormat("I will remember the location {0} for you", [dataObj.info.name]);
                        }
                    }
                    else if(res.results.type == "relationship"){
                        if(res.results.status == false){
                            finalResponse = self.jtools.stringFormat("You already told me to note {0} as {1}", [dataObj.info.name, dataObj.info.title]);
                        }
                        else {
                            finalResponse = self.jtools.stringFormat("I will remember that {0} is also your '{1}'", [dataObj.info.name, dataObj.info.title]);
                        }
                    }
                }
                else {
                    finalResponse = "Unable to complete: " + res.error;
                }

                callback({"jresponse": finalResponse});
            });

        }
        catch(ex){
            callback({"jresponse": "There seems to be an issue with my using settings: " + ex});
        }
    }

    /* replace Last Action */
    replaceLastAction(response, callback) {
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":null, "info":null};

        try {
            self.jcell.replaceLastAction(dataObj, function(res){
                if(res.error == null && res.results != null){
                    if(res.results.type == null) {
                        finalResponse = self.jtools.stringFormat("Unable to perform a replace the last action was {0}", [res.results.data.method]);
                    } 
                    else if(res.results.type == "location") {
                        if(res.results.status == true){
                            finalResponse = self.jtools.stringFormat("I switched the location for {0} to {1}", [res.results.data.name, res.results.data.address]);
                        }
                        else {
                            finalResponse = self.jtools.stringFormat("Unable to switch the location", []);
                        }
                    }                    
                }
                else {
                    finalResponse = "Unable to replace: " + res.error;
                }

                callback({"jresponse": finalResponse});
            });
        }
        catch(ex){
            callback({"jresponse": "There seems to be an issue with my replace: " + ex});
        }
    }

    /* Marvel Characters */
    marvelCharacter(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type":null, "info":null};

        try {

        }
        catch(ex){
            
        }
    }

    /* testCode */
    testCode(response, callback){
        var self = this;
        var finalResponse = null;
        var dataObj = {"type": null, "info":null};

        try {
            /*self.jcell.jeyes.motionTrackingCamera(function(ret){
                callback({"jresponse": "Test Motion Video Status: " + (ret == -100)});
            });*/

            //var tst = self.jcell.jeyes._processRecognitionImgs("C:\\Users\\krisr\\Pictures\\ImgRecog","C:\\Users\\krisr\\Documents\\Development\\Personal\\Jada\\jada_3\\config\\data\\photoMemory");
            
            //self.jcell.jeyes.faceRecognizeCamera(function(ret){
            //    callback({"jresponse": "Facial Recognition Video Status: " + (ret == -100)});
            //});

            //var tst = self.jcell.jeyes.facialRecognitionFile("C:\\Users\\krisr\\Pictures\\Wedding(AllenHouse)\\bridalpartyportraits\\1P9A9224.jpg");
            //var tst = self.jcell.jeyes.facialRecognitionFile("C:\\Users\\krisr\\Pictures\\Saved Pictures\\t2.png");
            //callback({"jresponse": "Test: I Found " + tst.join(", ") + " faces."});

            //var faceNum = self.jcell.jeyes.facemarkFile("C:\\Users\\krisr\\Pictures\\Saved Pictures\\t3.PNG");
            //callback({"jresponse": "Test: I Found " + faceNum + " faces."});

            //self.jcell.jeyes.liveCamera(function(ret){
            //    callback({"jresponse": "Test Video Status: " + (ret == -100)});
            //});

            //self.jcell.jeyes.facemarkCamera(function(ret){
            //    callback({"jresponse": "Test Video Status: " + (ret == -100)});
            //});   
            
            //self.jcell.jeyes.edgeDetectiongCamera(function(ret){
            //    callback({"jresponse": "Test Video Status: " + (ret == -100)});
            //});
            
            //self.jcell.jeyes.modelImgCamera("base", [], false, function(ret){
            //    callback({"jresponse": "Test Model Status: " + (ret == -100)});
            //});

            var tst = self.jcell.jeyes.modelImgFile("base", [], "C:\\Users\\krisr\\Pictures\\test\\IMG13.png", true, function(ret){
                callback({"jresponse": "Test: I Read " + ret});
            });
            
        }
        catch(ex){
            callback({"jresponse": "There is something wrong with your Demo: " + ex});
        }
    }

    /* Private functions */
    additionalPhraseSlicers(phrase, splicers) {
        var indexOf = -1;
        try {
            for(var i=0; i < splicers.length; i++){
                indexOf = phrase.indexOf(splicers[i]);
                if(indexOf >= 0) { break;}
            }
        }
        catch(ex){
            console.log(" x Error with Add Phrase Slicers");
        }
        return indexOf;
    }
/*END*/
}


module.exports = JNERVESYSTEM;