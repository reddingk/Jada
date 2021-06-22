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

    /* Get Current Weather */
    getWeatherCurrent(response, callback){
        var self = this, finalResponse = null;
        try {
            var apiResponse = null, dataObj = {"type":"find"};

            var tmpPhrase = response.fullPhrase.split(" ");
            var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("weather"));
            var forIndex = additionalPhraseSlicers(postPhrase, ["for", "in"]);        

            if(forIndex >= 0){
                dataObj.location = postPhrase.slice(forIndex+1).join(" ");
                
                self.jcell.weatherInfo(dataObj, response.userInfo, function(res){                 
                    if(res.error == null && res.results != null){
                        if(res.results.count > 0) {
                            finalResponse = self.jtools.stringFormat("The current weather accourding to OpenWeather.com for {0} is: Tempurature of {1}, Humidity of {2}%, with a description of '{3}'", [res.results.list[0].name, res.results.list[0].main.temp, res.results.list[0].main.humidity, res.results.list[0].weather[0].description ]);
                            apiResponse = { resultList: [res.results.list[0]]};                        
                        }
                        else {
                            finalResponse = self.jtools.stringFormat("Sorry we could not find the current weather for: {0}", [dataObj.location]);
                        }
                    }
                    else {
                        finalResponse = "There was an error while retrieving current weather data: " + res.error;
                    }
                    callback({"jresponse": finalResponse, "jtype":"weather", "jdata":apiResponse });
                });
            }
            else {
                finalResponse = "Im not sure where you would like me to look";
                callback({"jresponse": finalResponse, "jtype":"weather", "jdata":apiResponse});
            }
        }
        catch(ex){
            log.error("in getWeatherCurrent: " + ex);
            callback({"jresponse":"Issue with getWeatherCurrent, sorry"});
        }
    }

    /* Get Weather Forecast */
    getWeatherForecast(response, callback){
        var self = this, finalResponse = null;
        try {
            var apiResponse = {}, dataObj = {"type":"forecast"};

            var tmpPhrase = response.fullPhrase.split(" ");
            var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("forecast"));
            var forIndex = additionalPhraseSlicers(postPhrase, ["for", "in"]);

            if(forIndex >= 0){
                dataObj.location = postPhrase.slice(forIndex+1).join(" ");
                
                self.jcell.weatherInfo(dataObj, response.userInfo, function(res){                 
                    if(res.error == null && res.results != null){                   
                        if(res.results.list.length > 0) {                        
                            // Set initial parameters
                            var dateString = (new Date(res.results.list[0].dt_txt)).toDateString();
                            var dateNum = 0, avgTemp = 0, avgStatus = {}; 
                            var dateList = [], displayList = [], tmpData = {};
    
                            for(var i =0; i < res.results.list.length; i++){
                                var item = res.results.list[i];
                                var newDate = (new Date(item.dt_txt)).toDateString();                 
                                if(newDate != dateString ) {
                                    var dateStatus = {"data":null, "num": 0};     
                                    var lrgObj = Object.keys(avgStatus).reduce(function(a, b){ return avgStatus[a].num > avgStatus[b].num ? a : b });
                                    
                                    if(lrgObj != null){
                                        dateStatus = avgStatus[lrgObj];
                                    }
                                    // Set Days Data
                                    tmpData = {dt_txt:dateString, main:{temp:(avgTemp / dateNum).toFixed(2)}, weather:[dateStatus.data]};
                                    
                                    // Store Days Data
                                    displayList.push(self.jtools.stringFormat("{0} : {1} degrees and '{2}'", [dateString, (avgTemp / dateNum).toFixed(2), dateStatus.data.main]));
                                    dateList.push(tmpData);
    
                                    // Reset Data
                                    tmpData = {dt_txt:"", main:{temp:0}, weather:[]};
                                    //Reset tmp Values
                                    dateString = newDate; avgTemp = 0;                                
                                    dateNum = 0; avgStatus = {};
                                }
                                else {
                                    dateNum +=1.0;
                                    avgTemp += parseFloat(item.main.temp_max);
                                    if(item.weather[0].main in avgStatus){
                                        avgStatus[item.weather[0].main].num += 1;
                                    }
                                    else {
                                        avgStatus[item.weather[0].main] = {data:item.weather[0], num:1};
                                    }
                                }
                            } 
                            
                            finalResponse = self.jtools.stringFormat("The weather forecast for the next few days according to OpenWeather.com for {0}: \n {1}",[res.results.city.name, displayList.join("\n | ")]);
                            apiResponse = { dateList: dateList, resultList: res.results.list };
                        }
                        else {
                            finalResponse = self.jtools.stringFormat("Sorry we could not find the weather forecast for: {0}", [dataObj.location]);
                        }
                    }
                    else {
                        finalResponse = "There was an error while retrieving current weather data: " + res.error;
                    }
                    callback({"jresponse": finalResponse, "jtype":"weather", "jdata":apiResponse});
                });
            }
            else {
                finalResponse = "Im not sure where you would like me to look";
                callback({"jresponse": finalResponse, "jtype":"weather", "jdata":apiResponse});
            }
        }
        catch(ex){
            log.error("in getWeatherForecast: " + ex);
            callback({"jresponse":"Issue with getWeatherForecast, sorry"});
        }
    }

    /* Get Detailed Weather Forecast */
    getWeatherDetailedForecast(response, callback){
        var self = this, finalResponse = null;
        try {
            var apiResponse = null, dataObj = {"type":"forecast"};
            var tmpPhrase = response.fullPhrase.split(" ");
            var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("details"));
            var forIndex = additionalPhraseSlicers(postPhrase, ["for", "in"]); 

            if(forIndex >= 0){
                dataObj.location = postPhrase.slice(forIndex+1).join(" ");
                
                self.jcell.weatherInfo(dataObj, response.userInfo, function(res){                 
                    if(res.error == null && res.results != null){                   
                        if(res.results.list.length > 0) {  
                            var dateString = "";
                            finalResponse = self.jtools.stringFormat("The weather forecast for the next few days accourding to OpenWeather.com for {0}: ",[res.results.city.name]);
                            apiResponse = { resultList: res.results.list };

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
                    callback({"jresponse": finalResponse, "jtype":"weather", "jdata":apiResponse});
                });
            }
            else {
                finalResponse = "Im not sure where you would like me to look";
                callback({"jresponse": finalResponse, "jtype":"weather", "jdata":apiResponse});
            }
        }
        catch(ex){
            log.error("in getWeatherDetailedForecast: " + ex);
            callback({"jresponse":"Issue with getWeatherDetailedForecast, sorry"});
        }
    }

    /* Get Server CPU Arch */
    getCpuArch(response, callback){
        var self = this, finalResponse = null, dataObj = {"type":"arch"};
        try {
            this.jcell.getOSInfo(dataObj, response.userInfo, function(res){  
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
            log.error("in getCpuArch: " + ex);
            callback({"jresponse":"Issue with getCpuArch, sorry"});
        }
    }

    /* Get Server CPU Info */
    getCpuInfo(response, callback){
        var self = this, finalResponse = null, dataObj = {"type":"info"};
        try {
            this.jcell.getOSInfo(dataObj, response.userInfo, function(res){  
                if(res.error == null && res.results != null){
                    var cores = res.results;

                    finalResponse = self.jtools.stringFormat("You have {0} cores on this machine, they are the following: ", [cores.length]);
                    for(var i =0; i < cores.length; i++){ 
                        finalResponse += self.jtools.stringFormat("\n core {0}: {1}", [i, cores[i].model]);  
                    }                    
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error retrieving CPU INFO: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });      
        }
        catch(ex){
            log.error("in getCpuInfo: " + ex);
            callback({"jresponse":"Issue with getCpuInfo, sorry"});
        }
    }

    /* Get Server Computer Hostname */
    getComputerHostname(response, callback){
        var self = this, finalResponse = null, dataObj = {"type":"hostname"};
        try {
            this.jcell.getOSInfo(dataObj, response.userInfo, function(res){  
                if(res.error == null && res.results != null){
                    finalResponse = self.jtools.stringFormat("The computers hostname is {0}",[res.results]);
                }
                else {
                    finalResponse = self.jtools.stringFormat("Error Retrieving Computer Hostname: {0}", [res.error]);
                }
                callback({"jresponse": finalResponse, "jdata":res.results});
            });      
        }
        catch(ex){
            log.error("in getComputerHostname: " + ex);
            callback({"jresponse":"Issue with getComputerHostname, sorry"});
        }
    }

    /* Get Server Network Interface */
    getNetworkInterface(response, callback){
        var self = this, finalResponse = null, dataObj = {"type":"networkinterface"};
        try {
            this.jcell.getOSInfo(dataObj, response.userInfo, function(res){  
                if(res.error == null && res.results != null){
                    var network = res.results;
                    var info = null;  
                    for(var i in network) {
                        for(var j in network[i]){
                            var iface = network[i][j];
                            if(iface.family == "IPv4" && !iface.internal) {
                                info = iface; break;
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
            log.error("in getNetworkInterface: " + ex);
            callback({"jresponse":"Issue with getNetworkInterface, sorry"});
        }
    }

    /* Get Server System Release */
    getSystemRelease(response, callback){
        var self = this, finalResponse = null, dataObj = {"type":"systemrelease"};
        try {
            this.jcell.getOSInfo(dataObj, response.userInfo, function(res){  
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
            log.error("in getSystemRelease: " + ex);
            callback({"jresponse":"Issue with getSystemRelease, sorry"});
        }
    }

    /* Get Server System Memory */
    getSystemMemory(response, callback){
        var self = this, finalResponse = null, dataObj = {"type":"systemmemory"};
        try {
            this.jcell.getOSInfo(dataObj, response.userInfo, function(res){  
                if(res.error == null && res.results != null){
                    var memory = res.results, memPhrase = "";
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
            log.error("in getSystemMemory: " + ex);
            callback({"jresponse":"Issue with getSystemMemory, sorry"});
        }
    }

    /* Easter Eggs */
    easterEggs(reponse, callback){
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
            log.error(finalResponse);
        }
        callback({"jresponse": finalResponse});
    }

    /* Get directions */
    getDirections(response, callback){
        var self = this, finalResponse = null, apiResponse = null, dataObj = {};
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

                self.jcell.getDirections(dataObj, response.userInfo, function(res){
                    if(res.error != null || res.results == null){
                        finalResponse = self.jtools.stringFormat("Error Retrieving Directions: {0}", [res.error]);
                    }
                    else {
                        var resultList = [];
                        apiResponse = res.results;

                        resultList.push(self.jtools.stringFormat("It will take approximately {0} mins and {1} miles from '{2}': ", [res.results.time.toFixed(2), res.results.distance.toFixed(2), res.results.destTitle]));
                        
                        res.results.directions.forEach(function(dir){
                            resultList.push(self.jtools.stringFormat("{0} ({1} miles)", [dir.attributes.text, dir.attributes.length.toFixed(2)]));
                        }); 

                        finalResponse = resultList.join("\n\n");
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
            log.error("in getDirections: " + ex);
            callback({"jresponse":"Issue with getDirections, sorry"});
        }
    }
}

module.exports = JNERVESYSTEM;

/* Private Functions */
function additionalPhraseSlicers(phrase, splicers) {
    var indexOf = -1;
    try {
        for(var i=0; i < splicers.length; i++){
            indexOf = phrase.indexOf(splicers[i]);
            if(indexOf >= 0) { break;}
        }
    }
    catch(ex){
        log.error("With Add Phrase Slicers: ", ex);
    }
    return indexOf;
}

