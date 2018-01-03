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

class JCELL {  
    constructor(settingFile) {
        this.jtools = new Tools();
        this.settingFile = settingFile;
        this.cacheData = {"directions":{}};
        this.apiLib = {
            "tasteKid": {"link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"},
            "openWeather": {"link":"http://api.openweathermap.org/data/2.5/", "key":"90c2be179d4c18b392e3e11efa2ee5c1"},
            "iTranslate4": {"link":"http://itranslate4.eu/api/", "key":"d803c195-58f2-4b3d-adcf-4e5bfcc368c2"},
            "googleMapsDirections": {"link":"https://maps.googleapis.com/maps/api/directions/json", "key":"AIzaSyDmVwV-ugBBFPH9QxtFEPubd2X5ojRAH3o"},
            "googlePlaces":{"link":"https://maps.googleapis.com/maps/api/place/autocomplete/json", "key":"AIzaSyBwnJZ2hoaIBKMGHMqEFEqF_faxUTBfcMs"},
            "marvel": {"link":"https://gateway.marvel.com/", "key":"360f1fe1e9174b58521e32bb17e567fe", "privateKey":"2b05e2994b069d96faa718ad5ccf890aa13e100f"},
            "geoAPI": {"link":"http://ip-api.com/json"}
        };
    }
    
    getLocalDateTime(items, callback){
        var date = new Date();
        var self = this;
        var response = {"error":null, "results":null};


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

        if(api != null){
            try {
                if(!self.checkParameterList(["type", "location"], items)){
                    response.error = "Missing Parameter";
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

        if(api != null){
            try {        
                var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

                if(!self.checkParameterList(["toLoc","fromLoc","type"], items)){
                    response.error = "Missing Parameter";
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
        var date = new Date();
        var self = this;
        var response = {"error":null, "results":null};

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
        var date = new Date();
        var self = this;
        var response = {"error":null, "results":null};

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
        var date = new Date();
        var self = this;
        var response = {"error":null, "results":null};

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
        var date = new Date();
        var self = this;
        var response = {"error":null, "results":null};

        try {
            if(!self.checkParameterList(["type","info"], items)){
                response.error = "Missing Parameter";
            }
            else {
                var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

                if(items.type == "location"){
                    if(items.info.name in obj.locations){
                        response.results = {"status":false, "data":obj.locations[items.info.name]};
                    }
                    else {
                        obj.locations.push({"name":items.info.name, "address":items.info.address});
                        fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
                        response.results = {"status":true, "data":null};
                    }
                }
                else if(items.type == "relationship"){
                    var existingRelationship = underscore.filter(obj.relationships, function(dt) {  return dt.name == items.info.name; });
                    if(existingRelationship.length > 0){
                        if(items.info.title in existingRelationship[0].title){
                            response.results = {"status":false, "data":existingRelationship[0]};
                        }
                    }
                }
            }
        }
        catch(ex){

        }
    }

    /* private methods */
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
        var item = self.apiLib[name];
        return (item == undefined ? null : item);
    }
}

module.exports = JCELL;