'use strict';
/*
 * JADA CELL CLASS
 * By: Kris Redding
 */
var request = require('request');
var fs = require('fs');
var os = require('os');
var underscore = require('underscore');

require('dotenv').config();
const locationdb = require(process.env.CONFIG_LOC + "/locationdb.json");

const Tools = require('./jtools.js');
const Eyes = require('./jeyes.js');
const Lift = require('./jlift.js');
const apiLib = require("./config/apiLib.json");

class JCELL {  
    constructor() {
        this.jtools = new Tools();
        this.jeyes = new Eyes();
        this.jlift = new Lift(this.jtools);        
        this.mongoOptions = { connectTimeoutMS: 2000, socketTimeoutMS: 2000};
        this.cacheData = {"directions":{}};
    }
    
    getLocalDateTime(items, callback){
        var date = new Date();
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getLocalDateTime", items);
        
        try {
            if(!self.checkParameterList(["type"], items)){
                response.error = "Missing Parameter";
            }
            else {
                switch(items.type){
                    case "time":
                        var h = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
                        var m = (date.getMinutes() < 10 ? "0"+ date.getMinutes() : date.getMinutes());
                        var timeDelim = (date.getHours() > 12 ? "pm" : "am");
                        
                        response.results = self.jtools.stringFormat("{0}:{1} {2}",[h,m, timeDelim]);
                        break;
                    case "hour":
                        var h = date.getHours();
                        response.results = h;
                        break;
                    case "minutes":
                        var m = date.getMinutes();
                        response.results = m;
                        break;
                    case "date":
                        var mon_str =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        var day = date.getDate();
                        var mon = date.getMonth();
                        var yr = date.getFullYear();
                        response.results = self.jtools.stringFormat("{0} {1}, {2}",[mon_str[mon], day, yr]);
                        break;
                    case "month":
                        var mon_str =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        var mon = date.getMonth();
                        response.results = mon_str[mon];
                        break;
                    case "day":
                        var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ]
                        var name = weekday[d.getDay()];
                        response.results = name;
                        break;
                    default:
                        break;
                }
            }
        }
        catch(ex){
            this.jtools.errorLog(" [Error] Processing Request: " + ex);
        }
        callback(response);
    }

    /* Media Compare using tastekid api */
    mediaCompare(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        var api = self.getApiItem("tasteKid");
        self.saveLastAction("mediaCompare", items);
        
        if(api != null){
            try {
                if(!self.checkParameterList(["type", "query", "limit", "info"], items)){
                    response.error = "Missing Parameter";
                }
                else {                    
                    var url = self.jtools.stringFormat("{0}similar?q={1}&k={2}&type={3}&info={4}&limit={5}",[api.link, items.query.replace(" ", "+"), process.env.TASTEKID_KEY, items.type, items.info, items.limit]);
                    request({ url: url, json: true}, function (error, res, body){
                        if(!error && res.statusCode === 200){
                            response.results = body;                                
                            callback(response);
                        }
                    });
                }
            }
            catch(ex){
                response.error = "Error Proccessing API Request: " + ex;
                this.jtools.errorLog(response.error);                
                callback(response);
            }
        }
        else {
            response.error = "Unable to retrieve API data";
            callback(response);
        }        
    }  
    
    /* Weather Info using open weather map API */
    weatherInfo(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        var api = self.getApiItem("openWeather");
        self.saveLastAction("weatherInfo", items);      
        
        if(api != null){
            try {
                if(!self.checkParameterList(["type", "location"], items)){
                    response.error = "Missing Parameter";
                    callback(response);
                }
                else {                    
                    var url = self.jtools.stringFormat("{0}{1}?q={2}&appid={3}&units=imperial", [api.link, items.type, items.location.replace(" ", "+"), process.env.OPENWEATHER_KEY]);
                    request({ url: url, json: true}, function (error, res, body){
                        if(!error && res.statusCode === 200){
                            response.results = body;                                                   
                            callback(response);
                        }
                        else { 
                            var err = (res.statusCode != 200 && body && body.message ? body.message : error);
                            self.jtools.errorLog("[Error] weather info: " + err);
                            response.error = err;
                            callback(response);
                        }
                    });
                }
            }
            catch(ex){
                response.error = "Error Proccessing API Request: " + ex;  
                this.jtools.errorLog(response.error);              
                callback(response);
            }
        }
        else {
            response.error = "Unable to retrieve API data";
            callback(response);
        }
    }

    /* Change User Settings */
    getChangedSetting(item, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getChangedSetting", items);
        
        try {            
            if(!self.checkParameterList(["item", "newitem", "userId"], items)){
                response.error = "Missing Parameter";
            }
            else {
                var obj = this.jtools.getUserData(items.userId);

                switch(item.item){
                    case "fullname":
                        obj.name.fullname = item.newitem;
                        break;
                    case "nickname":
                        obj.name.nickname = item.newitem;
                        break;
                    case "voice":
                        obj.voice = (item.newitem == "on" ? "on": "off");
                        break;
                    default:
                        break;
                }

                // Change Setting in DataBase                
                this.jtools.updateUserData(items.userId, obj);
                response.results = { "updated":true, "item":item.item, "newState":item.newitem};
            }
        }
        catch(ex){
            response.error = self.jtools.stringFormat("Error updating {0} to {1}: {2}", [item.item, item.newitem, ex]);
            this.jtools.errorLog(response.error);
        }
        callback(response);
    }

    /* get Directions */
    getDirections(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        var api = self.getApiItem("googleMapsDirections");
        self.saveLastAction("getDirections", items);
        
        if(api != null){
            try {        
                var obj = this.jtools.getUserData(items.userId);

                if(!self.checkParameterList(["toLoc","fromLoc","type"], items)){
                    response.error = "Missing Parameter";
                    callback(response);
                }
                else {                    
                    if(items.toLoc in obj.locations){ items.toLoc = obj.locations[items.toLoc].address; }
                    if(items.fromLoc in obj.locations){ items.fromLoc = obj.locations[items.fromLoc].address; }

                    var requestId = self.jtools.stringFormat("{0}|{1}|{2}", [items.fromLoc.replace(/\s/g,"+"), items.toLoc.replace(/\s/g,"+"), items.type]);

                    if(requestId in self.cacheData.directions){                        
                        response.results = self.cacheData.directions[requestId];
                        callback(response);
                    }
                    else {
                        var url = self.jtools.stringFormat("{0}?key={1}&origin={2}&destination={3}&mode={4}",[api.link, process.env.GOOGLEMAPS_KEY, items.fromLoc.replace(/\s/g,"+"), items.toLoc.replace(/\s/g,"+"), items.type]);

                        request({ url: url, json: true}, function (error, res, body){                        
                            if(!error && res.statusCode === 200){
                                response.results = body; 
                                self.cacheData.directions[requestId] = body;                                                           
                            }
                            else {
                                response.error = "error with request";
                            }
                            callback(response);
                        });
                    }
                }
            }
            catch(ex){
                response.error = "Error Proccessing API Request: " + ex;  
                this.jtools.errorLog(response.error);              
                callback(response);
            }
        }
        else {
            response.error = "Unable to retrieve API data";
            callback(response);
        }
    }

    /* getserver Operating System Info */
    getOSInfo(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getOSInfo", items);
        
        try {
            if(!self.checkParameterList(["type"], items)){
                response.error = "Missing Parameter";
            }
            else {
                switch(items.type){
                    case "arch":                      
                      response.results = os.arch();
                      break;                    
                    case "info":                      
                      response.results = os.cpus();
                      break;
                    case "hostname":                      
                      response.results = os.hostname();
                      break;
                    case "networkinterface":                      
                      response.results = os.networkInterfaces();
                      break;
                    case "systemrelease":                      
                      response.results = os.release();
                      break;
                    case "systemmemory":                      
                      response.results = os.totalmem();
                      break;                    
                    default:
                        break;
                }
            }
        }
        catch(ex){
            response.error = "Error retrieving OS data";
            this.jtools.errorLog(response.error);
        }
        
        callback(response);
    }

    getRelationships(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getRelationship", items);
        
        try {
            if(!self.checkParameterList(["type","searchName", "userId"], items)){
                response.error = "Missing Parameter";
            }
            else {
                var obj = this.jtools.getUserData(items.userId);
                var userRelationships = obj.relationships;
                var relationships = [];

                if(items.type == "me"){
                    relationships.push({"type":"me", "info":{"name":obj.name.fullname, "nickname":obj.name.nickname}});
                }
                else {
                    for(var i =0; i < userRelationships.length; i++){  
                        if(userRelationships[i].name.indexOf(items.searchName) > -1) {
                        relationships.push({"type":"name", "info":userRelationships[i]});
                        }
                        else if(items.searchName in userRelationships[i].title){
                        relationships.push({"type":"title", "info":userRelationships[i]});
                        }
                    }
                }

                response.results = relationships;
            }
        }
        catch(ex){
            response.error = "Error getting relationship information";
            this.jtools.errorLog(response.error);
        }
        callback(response);
    }

    /* Get Location */
    getLocation(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getLocation", items);

        try {
            if(!self.checkParameterList(["type","searchName"], items)){
                response.error = "Missing Parameter";
            }
            else {
                if(items.type == "me"){
                    var api = self.getApiItem("geoAPI");

                    if(api != null){
                        try{
                          var url = api.link;
                          request(url, function (error, res, body){                                                           
                              if(!error && res.statusCode === 200){                                
                                response.results = {"type":"me", "location": JSON.parse(body)};
                              }
                              callback(response);
                          });
                        }
                        catch(err){
                          response.error = "Error with request: "+ err;
                          this.jtools.errorLog(response.error);
                          callback(response);
                        }
                    }
                }
                else if(items.type == "other"){
                    var obj = this.jtools.getUserData(items.userId);
 
                    response.results = {"type":"other", "location": obj.locations[items.searchName]};
                    callback(response);
                }
                else {
                    response.error = "sorry you didn't give me a location name I could work with.";
                    callback(response);
                }
            }
        }
        catch(ex){
            response.error = "Sorry there was a larger error getting location info:" + ex;
            this.jtools.errorLog(response.error);
            callback(response);
        }
    }

    /* Add User Setting to data file */
    addUserSetting(items, callback){        
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("addUserSetting", items);

        try {
            if(!self.checkParameterList(["type","info"], items)){
                response.error = "Missing Parameter";
            }
            else {
                var obj = this.jtools.getUserData(items.userId);

                if(items.type == "location"){
                    if(items.info.name in obj.locations){                        
                        response.results = {"status":false, "type":"location", "data":obj.locations[items.info.name]};
                    }
                    else {                        
                        obj.locations[items.info.name] = {"name":items.info.name, "address":items.info.address};
                        
                        self.jtools.updateUserData(items.userId, obj);
                        response.results = {"status":true, "type":"location", "data":null};
                    }
                }
                else if(items.type == "relationship"){
                    var existingRelationship = underscore.filter(obj.relationships, function(dt) {  return dt.name == items.info.name; });
                    if(existingRelationship.length > 0){
                        if(items.info.title in existingRelationship[0].title){                            
                            response.results = {"status":false, "type":"relationship", "data":existingRelationship[0]};
                        }
                        else {                            
                            var reIndex = obj.relationships.findIndex(i => i.name == items.info.name);
                            obj.relationships[reIndex].title[items.info.title] = true;
                            
                            self.jtools.updateUserData(items.userId, obj);
                            response.results = {"status":true, "type":"relationship", "data":null};
                        }
                    }
                    else {                        
                        var newRel = { "name":items.info.name, "title":{}};
                        newRel.title[items.info.title] = true;
                        
                        obj.relationships.push(newRel);
                        self.jtools.updateUserData(items.userId, obj);
                        response.results = {"status":true, "type":"relationship", "data":null};
                    }
                }
                else {
                    response.error = "Sorry I am not sure what should be updated";
                }
            }
        }
        catch(ex){
            response.error = "Sorry there was a larger error getting setting user info:" + ex; 
            this.jtools.errorLog(response.error);           
        }
        callback(response);
    }
    
    /* Run a replace on the last action called */
    replaceLastAction(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        var prev = self.saveLastAction("replaceLastAction", items);
        var obj = self.jtools.getUserData(items.userId);        

        try {
            if(prev != null && prev.method == "addUserSetting"){
                if(prev.data.type == "location") {
                    if(prev.data.info.name in obj.locations) {
                        obj.locations[prev.data.info.name] = {"name": prev.data.info.name, "address": prev.data.info.address};
                        self.jtools.updateUserData(items.userId, obj);

                        response.results = { "status":true, "type":"location", "data": prev.data.info};
                    }
                    else {
                        response.results = {"status":false, "type":"location", "data":prev.data.info};
                    }
                }
                else {
                    response.results = { "status": false, "type":null, "data":prev };
                }
            }
            else {
                response.results = { "status": false, "type":null, "data":prev };
            }
        }
        catch(ex){
            response.error = "Error with replace: " + ex;
            this.jtools.errorLog(response.error);
        }

        callback(response);
    }

    /* Get Sports Schedule */
    getSportsSchedule(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getSportsSchedule", items);

        var sportsUrls = {
            "nfl":"espn.com/nfl/schedule",
            "nba":"espn.com/nba/schedule"
        };

        try {
            if(!self.checkParameterList(["sport", "day_week"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var sportStr = items.sport.toLowerCase();
                if(sportStr in sportsUrls){                    
                    this.jlift.sports[sportsUrls[sportStr]]({"url":sportsUrls[sportStr], "day_week":items.day_week},
                    function(res){
                        response.results = res;
                        callback(response);
                    });
                }
                else {
                    response.error = "We can't get that sports schedule yet";
                    callback(response);
                }
            }
        }
        catch(ex){
            response.error = "Error getting sports schedule: " + ex;
            this.jtools.errorLog(response.error);
            callback(response);
        }
    }

    /* Get Map Countries By Continent */
    getMapCountriesByContinent(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getMapCountriesByContinent", items);

        try {
            if(!self.checkParameterList(["location"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var getReturn = {'name':1,'capital':1,'countryCode':1,'continent':1,'states.name':1,'states.capital':1};
                
                var regex = "/" + items.location + "/i";
                var ret = underscore.filter(locationdb, function(obj){ return obj.continent.match(regex);});
                
                response.results = ret;
                callback(response);
            }
        }
        catch(ex){
            response.error = "Error getting maps country info: " + ex;
            this.jtools.errorLog(response.error);
            callback(response);
        }
    }

    /* Get Capital Data */
    getMapCapital(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getMapCapital", items);

        try {
            if(!self.checkParameterList(["location", "isState"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var getQuery = (items.isState ? {'name': {'$regex': items.location } } : {'$or': [{'name':{'$regex':items.location}},{'states.name': {'$regex': items.location }}]});
                var getReturn = {'name':1,'capital':1,'countryCode':1,'continent':1,'states.name':1,'states.capital':1};
                
                var regex = new RegExp(items.location,'i');
                
                var ret = ( !items.isState ?
                            underscore.filter(locationdb, function(obj){ return obj.name.match(regex);}) :
                            underscore.filter(locationdb, function(obj){ 
                                var stateName = false;
                                if(obj.states) { 
                                    for(var i =0; i < obj.states.length; i++){
                                        if(obj.states[i].name.match(regex)){
                                            stateName = true;
                                            break;
                                        }
                                    }
                                }
                                return stateName || obj.name.match(regex);
                            })
                          );
                
                if(!items.isState){
                    // Return All
                    response.results = ret;
                }
                else {
                    // Filter countries
                    var tmpCountries = ret.filter(function(item){ return item.name.indexOf(items.location) >= 0; }).map(item => ({name: item.name, capital:item.capital, countryCode:item.countryCode, type:"country"}));
                    // Filter states
                    var tmpCountryStates = ret.filter(
                        function(country){ 
                            var tmpCntry = country.states.filter(function(item){
                                return item.name.indexOf(items.location) >= 0;
                            });
                            return (tmpCntry && tmpCntry.length > 0);
                        });
                    
                    var tmpStates = [];                                
                    tmpCountryStates.forEach(function(stItem){ 
                        tmpStates = tmpStates.concat(stItem.states.filter(function(item){ return item.name.indexOf(items.location)  >= 0; }).map(itemMap => ({name: itemMap.name, capital:itemMap.capital, countryCode:stItem.countryCode, type:"state"})));
                    });
                                                    
                    // Join Lists
                    response.results = tmpCountries.concat(tmpStates);
                }

                callback(response);
            }
        }
        catch(ex){
            response.error = "Error getting maps capital info: " + ex;
            this.jtools.errorLog(response.error);
            callback(response);
        }
    }

    /* Search Movie DB By Type */
    searchMovieDB(items, callback){        
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("searchMovieDB", items);

        try {
            if(!self.checkParameterList(["type", "query"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var api = self.getApiItem("movieDb");
                if(api == null){
                    response.error = "Unable to retrieve API data";
                    callback(response);
                }
                else {
                    var url = self.jtools.stringFormat("{0}search/{1}?api_key={2}&query={3}",[api.link, items.type, process.env.MOVIEDB_KEY, items.query]);
                    request({ url: url, json: true}, function (error, res, body){
                        if(!error && res.statusCode === 200){
                            response.results = body;                                
                        }
                        else {
                            response.error = error;
                        }
                        callback(response);
                    });
                }
            }
        }
        catch(ex){
            response.error = "Sorry we were not able to complete search of movie db: " + ex;
            this.jtools.errorLog(response.error);  
            callback(response);          
        }
    }

    /* List special items from Movie DB */
    listMovieDBSpecialItems(items, callback){        
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("listMovieDBSpecialItems", items);

        try {
            if(!self.checkParameterList(["type"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var api = self.getApiItem("movieDb");
                if(api == null){
                    response.error = "Unable to retrieve API data";
                    callback(response);
                }
                else {
                    var url = self.jtools.stringFormat("{0}{1}?api_key={2}",[api.link, items.type, process.env.MOVIEDB_KEY]);

                    request({ url: url, json: true}, function (error, res, body){
                        if(!error && res.statusCode === 200){
                            response.results = body;                                
                        }
                        else {
                            response.error = error;
                        }
                        callback(response);
                    });
                }
            }
        }
        catch(ex){
            response.error = "Sorry we were not able to complete search of movie db: " + ex;  
            this.jtools.errorLog(response.error);
            callback(response);          
        }
    }

    /* Search Movie DB By ID */
    searchMBDById(items, callback){        
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("searchMBDById", items);

        try {
            if(!self.checkParameterList(["type", "infotype", "typeid"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var api = self.getApiItem("movieDb");
                if(api == null){
                    response.error = "Unable to retrieve API data";
                    callback(response);
                }
                else {
                    var url = self.jtools.stringFormat("{0}{1}/{2}{3}?api_key={4}",[api.link, items.type, items.typeid, items.infotype, process.env.MOVIEDB_KEY]);
                    request({ url: url, json: true}, function (error, res, body){
                        if(!error && res.statusCode === 200){
                            response.results = body;                                
                        }
                        else {
                            response.error = error;
                        }
                        callback(response);
                    });
                }
            }
        }
        catch(ex){
            response.error = "Sorry we were not able to complete ID search of movie db: " + ex;  
            this.jtools.errorLog(response.error);
            callback(response);          
        }
    }

    /* Get Cast & Crew that worked on similar project types [MovieDB] */
    compareCastMovieDB(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("compareCastMovieDB", items);

        try {
            if(!self.checkParameterList(["type", "projectlist"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else{
                var keyAttr = (items.type == "movie" ? "title" : "name");
                var processStatus = {
                    "idRetrievedList":[],
                    "projectCastList":{},
                    "projectList":{},
                    "finalCastList":{}
                };

                function compareItems(pStatus, projectlist, fresponse, callback) {
                    pStatus.idRetrievedList.push(true);
                    if(pStatus.idRetrievedList.length >= projectlist.length) {
                        var idList = Object.keys(pStatus.projectCastList);

                        for(var j =0; j < idList.length; j++){
                            var idObj = pStatus.projectCastList[idList[j]].results;
                            // Get Cast 
                            for(var k = 0; k < idObj.cast.length; k++){
                                if(pStatus.finalCastList[idObj.cast[k].id]){
                                    if(!pStatus.finalCastList[idObj.cast[k].id].projectIds.includes(idList[j])){
                                        pStatus.finalCastList[idObj.cast[k].id].projectIds.push(idList[j]);
                                    }
                                }
                                else {
                                    pStatus.finalCastList[idObj.cast[k].id] = { id: idObj.cast[k].id, name:idObj.cast[k].name, profile_path: idObj.cast[k].profile_path, projectIds:[ idList[j] ]};
                                }
                            }

                            // Get Crew
                            for(var k = 0; k < idObj.crew.length; k++){
                                if(pStatus.finalCastList[idObj.crew[k].id]){
                                    if(!pStatus.finalCastList[idObj.crew[k].id].projectIds.includes(idList[j])){
                                        pStatus.finalCastList[idObj.crew[k].id].projectIds.push(idList[j]);
                                    }
                                }
                                else {
                                    pStatus.finalCastList[idObj.crew[k].id] = { id: idObj.crew[k].id, name:idObj.crew[k].name, profile_path: idObj.crew[k].profile_path, projectIds:[ idList[j] ]};
                                }
                            }
                        }

                        fresponse.results = pStatus;
                        callback(fresponse);
                    }
                }                

                for(var g=0; g < items.projectlist.length; g++)
                {                    
                    self.searchMovieDB({"type":items.type, "query":items.projectlist[g], "userId": items.userId}, function(ret){
                        if(ret.error || ret.results == null){
                            response.error = ret.error;
                            callback(response);
                        }
                        else if(ret.results.total_results == 0) {
                            response.error = "Unable to Find Project: " + items.projectlist[g];
                            callback(response);
                        }
                        else {
                            var selectedItem = ret.results.results[0];
                            
                            if(processStatus.projectCastList[selectedItem.id]) {
                                compareItems(processStatus, items.projectlist, response, function(finalRet){ callback(finalRet); });
                            }
                            else {                    
                                self.searchMBDById({"type":items.type, "infotype":"/credits", "typeid": selectedItem.id, "userId": items.userId}, function(ret2){
                                    if(ret.error || ret.results == null){
                                        response.error = ret.error;
                                        callback(response);
                                    }
                                    else {
                                        processStatus.projectList[selectedItem[keyAttr]] = selectedItem.id;
                                        processStatus.projectCastList[ret2.results.id] = ret2;
                                    }
                                    compareItems(processStatus, items.projectlist, response, function(finalRet){ callback(finalRet); });
                                });
                            }
                        }
                    });
                }
            }
        }
        catch(ex){
            response.error = "Sorry we were not able to complete compare for that project combination: " + ex;  
            this.jtools.errorLog(response.error);
            callback(response);          
        }
    }

    /* Get Projects that similar cast & crew worked on [MovieDB] */ 
    compareProjectsMovieDB(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("compareProjectsMovieDB", items);

        try {
            if(!self.checkParameterList(["personlist"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else{
                var processStatus = {
                    "idRetrievedList":[],
                    "personProjectList":{},
                    "personList":{},
                    "finalProjectList":{}
                };

                function compareItems(pStatus, personlist, fresponse, callback) {
                    pStatus.idRetrievedList.push(true);
                    if(pStatus.idRetrievedList.length >= personlist.length) {
                        var idList = Object.keys(pStatus.personProjectList);

                        for(var j =0; j < idList.length; j++){
                            var idObj = pStatus.personProjectList[idList[j]].results;
                            // Get Cast 
                            for(var k = 0; k < idObj.cast.length; k++){
                                if(pStatus.finalProjectList[idObj.cast[k].id]){
                                    if(!pStatus.finalProjectList[idObj.cast[k].id].personIds.includes(idList[j])){
                                        pStatus.finalProjectList[idObj.cast[k].id].personIds.push(idList[j]);
                                    }
                                }
                                else {
                                    pStatus.finalProjectList[idObj.cast[k].id] = { id: idObj.cast[k].id, media_type: idObj.cast[k].media_type, title:(idObj.cast[k].media_type == "movie" ? idObj.cast[k].title : idObj.cast[k].name), profile_path: idObj.cast[k].profile_path, personIds:[ idList[j] ]};
                                }
                            }

                            // Get Crew
                            for(var k = 0; k < idObj.crew.length; k++){
                                if(pStatus.finalProjectList[idObj.crew[k].id]){
                                    if(!pStatus.finalProjectList[idObj.crew[k].id].personIds.includes(idList[j])){
                                        pStatus.finalProjectList[idObj.crew[k].id].personIds.push(idList[j]);
                                    }
                                }
                                else {
                                    pStatus.finalProjectList[idObj.crew[k].id] = { id: idObj.crew[k].id, media_type: idObj.crew[k].media_type, title:(idObj.crew[k].media_type == "movie" ? idObj.crew[k].title : idObj.crew[k].name), profile_path: idObj.crew[k].profile_path, personIds:[ idList[j] ]};
                                }
                            }
                        }

                        fresponse.results = pStatus;
                        callback(fresponse);
                    }
                }                
                
                for(var g=0; g < items.personlist.length; g++)
                {                    
                    self.searchMovieDB({"type":"person", "query":items.personlist[g], "userId": items.userId}, function(ret){
                        if(ret.error || ret.results == null){
                            response.error = ret.error;
                            callback(response);
                        }
                        else if(ret.results.total_results == 0) {
                            response.error = "Unable to Find Person: " + items.personlist[g];
                            callback(response);
                        }
                        else {
                            var selectedItem = ret.results.results[0];
                            
                            if(processStatus.personProjectList[selectedItem.id]) {
                                compareItems(processStatus, items.personlist, response, function(finalRet){ callback(finalRet); });
                            }
                            else {                    
                                self.searchMBDById({"type":"person", "infotype":"/combined_credits", "typeid": selectedItem.id, "userId": items.userId}, function(ret2){
                                    if(ret.error || ret.results == null){
                                        response.error = ret.error;
                                        callback(response);
                                    }
                                    else {
                                        processStatus.personList[selectedItem.name] = selectedItem.id;
                                        processStatus.personProjectList[ret2.results.id] = ret2;
                                    }
                                    compareItems(processStatus, items.personlist, response, function(finalRet){ callback(finalRet); });
                                });
                            }
                        }
                    });
                }
            }
        }
        catch(ex){
            response.error = "Sorry we were not able to complete compare for that person combination: " + ex;  
            this.jtools.errorLog(response.error);
            callback(response);          
        }
    }

    /* private methods */
    saveLastAction(method, data) {
        var self = this;
        var prevResponse = null;

        try {
            var obj = this.jtools.getUserData(data.userId);        
            prevResponse = obj.lastAction;
            obj.lastAction = {"method":method, "data":data};
            self.jtools.updateUserData(data.userId, obj);
        }
        catch(ex){
            this.jtools.errorLog(" [ERROR] Saving Last Action: " + ex);
        }

        return prevResponse;
    }

    checkParameterList(params, items){        
        for(var i =0; i < params.length; i++){
            if(!(params[i] in items)){
                return false;
            }
        }
        return true;
    }

    getApiItem(name){        
        var item = apiLib[name];
        return (item == undefined ? null : item);
    }    
}

module.exports = JCELL;