'use strict';
/*
 * JADA CELL CLASS
 * By: Kris Redding
 */
var request = require('request');

const Tools = require('./jtools.js');

class JCELL {  
    constructor() {
        this.jtools = new Tools();
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