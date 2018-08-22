'use strict';
/*
 * JADA CELL CLASS
 * By: Kris Redding
 */
var request = require('request');
var fs = require('fs');
var os = require('os');
var underscore = require('underscore');

const Tools = require('./jtools.js');
const Eyes = require('./jeyes.js');
const Lift = require('./jlift.js');
const apiLib = require("./config/apiLib.json");

class JCELL {  
    constructor(settingFile) {
        this.jtools = new Tools();
        this.jeyes = new Eyes();
        this.jlift = new Lift(this.jtools);
        this.settingFile = settingFile;
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
            console.log("Error Processing Request: " + ex);
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
                    var url = self.jtools.stringFormat("{0}similar?q={1}&k={2}&type={3}&info={4}&limit={5}",[api.link, items.query.replace(" ", "+"), api.key, items.type, items.info, items.limit]);
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
                    var url = self.jtools.stringFormat("{0}{1}?q={2}&appid={3}&units=imperial", [api.link, items.type, items.location.replace(" ", "+"), api.key]);
                    
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
            var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

            if(!self.checkParameterList(["item", "newitem"], items)){
                response.error = "Missing Parameter";
            }
            else {
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

                // Chang Setting in DataBase
                fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
                response.results = { "updated":true, "item":item.item, "newState":item.newitem};
            }
        }
        catch(ex){
            response.error = self.jtools.stringFormat("Error updating {0} to {1}: {2}", [item.item, item.newitem, ex]);
        }
    }

    /* get Directions */
    getDirections(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        var api = self.getApiItem("googleMapsDirections");
        self.saveLastAction("getDirections", items);
        
        if(api != null){
            try {        
                var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

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
                        var url = self.jtools.stringFormat("{0}?key={1}&origin={2}&destination={3}&mode={4}",[api.link, api.key, items.fromLoc.replace(/\s/g,"+"), items.toLoc.replace(/\s/g,"+"), items.type]);

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
        }
        
        callback(response);
    }

    getRelationships(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getRelationship", items);
        
        try {
            if(!self.checkParameterList(["type","searchName"], items)){
                response.error = "Missing Parameter";
            }
            else {
                var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));
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
                          callback(response);
                        }
                    }
                }
                else if(items.type == "other"){
                    var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));
 
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
                var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

                if(items.type == "location"){
                    if(items.info.name in obj.locations){                        
                        response.results = {"status":false, "type":"location", "data":obj.locations[items.info.name]};
                    }
                    else {                        
                        obj.locations[items.info.name] = {"name":items.info.name, "address":items.info.address};
                        fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
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
                            
                            fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
                            response.results = {"status":true, "type":"relationship", "data":null};
                        }
                    }
                    else {                        
                        var newRel = { "name":items.info.name, "title":{}};
                        newRel.title[items.info.title] = true;
                        
                        obj.relationships.push(newRel);
                        fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
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
        }
        callback(response);
    }
    
    /* Run a replace on the last action called */
    replaceLastAction(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        var prev = self.saveLastAction("replaceLastAction", items);
        var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

        try {
            if(prev != null && prev.method == "addUserSetting"){
                if(prev.data.type == "location") {
                    if(prev.data.info.name in obj.locations) {
                        obj.locations[prev.data.info.name] = {"name": prev.data.info.name, "address": prev.data.info.address};
                        fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});

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
        }

        callback(response);
    }

    /* Get Sports Schedule */
    getSportsSchedule(items, callback){
        var self = this;
        var response = {"error":null, "results":null};
        self.saveLastAction("getSportsSchedule", items);

        var sportsUrls = {
            "nfl":"espn.com/nfl/schedule"
        };

        try {
            if(!self.checkParameterList(["sport", "week"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var sportStr = items.sport.toLowerCase();
                if(sportStr in sportsUrls){                    
                    this.jlift.sports[sportsUrls[sportStr]]({"url":sportsUrls[sportStr], "week":items.week},
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
            callback(response);
        }
    }

    /* private methods */
    saveLastAction(method, data) {
        var self = this;
        var prevResponse = null;

        try {
            var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));        
            prevResponse = obj.lastAction;
            obj.lastAction = {"method":method, "data":data};
            fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
        }
        catch(ex){
            console.log("save Last Action Error: " + ex);
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
        var self = this;
        var item = apiLib[name];
        return (item == undefined ? null : item);
    }
}

module.exports = JCELL;