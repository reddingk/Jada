'use strict';
/*
 * JADA CELL CLASS
 * By: Kris Redding
 */

const log = require('../server/services/log.service');
const axios = require('axios');
const os = require('os');
const Tools = require('./jtools.js');

const locationdb = require(process.env.CONFIG_LOC + "/locationdb.json");
const apiLib = require(process.env.CONFIG_LOC + "/apiLib.json");

class JCELL {  
    constructor() {
        this.jtools = new Tools();
    }

    /* Get Local Date & Time */
    getLocalDateTime(items, userInfo, callback){
        var date = new Date(), self = this;
        var response = {"error":null, "results":null};
        
        try {
            saveLastAction("getLocalDateTime", userInfo, items);
            
            if(!checkParameterList(["type"], items)){
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
                        var day = date.getDate(), mon = date.getMonth(), yr = date.getFullYear();
                        response.results = self.jtools.stringFormat("{0} {1}, {2}",[mon_str[mon], day, yr]);
                        break;
                    case "month":
                        var mon_str = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
            log.error("getting local dateTime: " + ex);
            response.error = "Getting Local DateTime:" + ex;
        }
        callback(response);
    }

    /* Get Map Countries By Continent */
    getMapCountriesByContinent(items, userInfo, callback){        
        var response = {"error":null, "results":null};

        try {
            saveLastAction("getMapCountriesByContinent", userInfo, items);

            if(!checkParameterList(["location"], items)){
                response.error = "Missing Parameter";
            }
            else {
                var regex = "/" + items.location + "/i";                
                response.results = locationdb.filter(function(obj){ return obj.continent.match(regex);});
            }
        }
        catch(ex){
            response.error = "Error getting maps country info: " + ex;
            log.error(response.error);
        }

        callback(response);
    }

    /* Get Capital Data */
    getMapCapital(items, userInfo, callback){
        var response = {"error":null, "results":null};

        try {
            saveLastAction("getMapCapital", userInfo, items);
            if(!checkParameterList(["location", "isState"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {                
                var regex = new RegExp(items.location,'i');
                
                var ret = ( !items.isState ?
                    locationdb.filter(function(obj){ return obj.name.match(regex);}) :
                    locationdb.filter(function(obj){ 
                        var stateName = false;
                        if(obj.states) { 
                            for(var i =0; i < obj.states.length; i++){
                                if(obj.states[i].name.match(regex)){
                                    stateName = true; break;
                                }
                            }
                        }
                        return stateName || obj.name.match(regex);
                    }));
                
                    // Return All
                if(!items.isState){ response.results = ret;}
                else {
                    // Filter countries
                    var tmpCountries = ret.filter(function(item){ return item.name.indexOf(items.location) >= 0; }).map(item => ({name: item.name, capital:item.capital, countryCode:item.countryCode, type:"country"}));
                    // Filter states
                    var tmpCountryStates = ret.filter(function(country){ 
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
            }
        }
        catch(ex){
            response.error = "Error getting maps capital info: " + ex;
            log.error(response.error);
        }

        callback(response);
    }

    /* Media Compare using tastekid api */
    mediaCompare(items, userInfo, callback){
        var self = this, response = {"error":null, "results":null};
        try {           
            var api = getApiItem("tasteKid");
            saveLastAction("mediaCompare", userInfo, items);
            
            if(api != null){                
                if(!checkParameterList(["type", "query", "limit", "info"], items)){
                    response.error = "Missing Parameter";
                }
                else {                    
                    var url = self.jtools.stringFormat("{0}similar?q={1}&k={2}&type={3}&info={4}&limit={5}",[api.link, items.query.replace(" ", "+"), process.env.TASTEKID_KEY, items.type, items.info, items.limit]);
                    axios.get(url).then(function(dataRet){
                        if(dataRet.status == 200){ response.results = dataRet.data; }
                        else { response.error = "Error Retrieving Tastekid data";  } 
                        callback(response);                       
                    }).catch(function(error){
                        response.error = "Issue Retrieving Tastekid data (L1): " + error;
                        log.error(response.error);
                        callback(response);
                    });
                }
            }
            else {
                response.error = "Unable to retrieve API data";
                log.error(response.error);
                callback(response);
            }
        }
        catch(ex){
            response.error = "Issue With Media Compare";
            log.error(response.error);
            callback(response);
        }        
    } 

    /* Weather Info using open weather map API */
    weatherInfo(items, userInfo, callback){
        var response = {"error":null, "results":null};
        try {
            var api = getApiItem("openWeather");
            saveLastAction("weatherInfo", userInfo, items);
            
            if(api != null){                
                if(!checkParameterList(["type", "location"], items)){
                    response.error = "Missing Parameter";
                    callback(response);
                }
                else {                    
                    var url = this.jtools.stringFormat("{0}{1}?q={2}&appid={3}&units=imperial", [api.link, items.type, items.location.replace(" ", "+"), process.env.OPENWEATHER_KEY]);
                    
                    axios.get(url).then(function(dataRet){
                        if(dataRet.status == 200){
                            response.results = dataRet.data; 
                        }
                        else { 
                            response.error = "Issue retrieving weather data";
                            log.error("weather info (E2): " + response.error);                             
                        }
                        callback(response);
                    }).catch(function(error){
                        response.error = "Issue Retrieving Weather data (E1): " + error;
                        log.error(response.error);
                        callback(response);
                    });
                }                
            }
            else {
                response.error = "Unable to retrieve API data";
                log.error(response.error); callback(response);
            }
        }
        catch(ex){
            response.error = "Issue With Weather Info";
            log.error(response.error); callback(response);
        }
    }

    /* getserver Operating System Info */
    getOSInfo(items, userInfo, callback){
        var response = {"error":null, "results":null};
        
        try {
            saveLastAction("getOSInfo", userInfo, items);

            if(!checkParameterList(["type"], items)){
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
            log.error(response.error);
        }
        
        callback(response);
    }

    /* get Directions */
    getDirections(items, userInfo, callback){
        var self = this, response = {"error":null, "results":null};
        try {
            saveLastAction("getDirections", userInfo, items);
            if(!checkParameterList(["toLoc","fromLoc","type"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var url = self.jtools.stringFormat("{0}/fillmore/location/directions",[process.env.BASE_PATH]);
                var getHeaders = { 'Content-Type': 'application/json', 'Authorization': userInfo.token };
                var postData = { "locationFrom":items.fromLoc, "locationTo":items.toLoc };
                
                axios.post(url, postData, { headers: getHeaders })
                .then(function(dataRes) { callback(dataRes.data); console.log(dataRes); })
                .catch(function(error){
                    response.error = "Issue retrieving directions (L1): " + error;
                    log.error(response.error); callback(response);
                });
            }
        }
        catch(ex){
            response.error = "Error retrieving directions";
            log.error(response.error);
            callback(response);
        }
    }

    /* get TMDB list info */
    getTMDBLists(items, userInfo, callback){
        var self = this, response = {"error":null, "results":null};
        try {
            saveLastAction("getTMDBLists", userInfo, items);
            if(!checkParameterList(["type", "page"], items)){
                response.error = "Missing Parameter";
                callback(response);
            }
            else {
                var api = getApiItem("movieDb"), url = null;

                switch(items.type){
                    case "now_playing":
                        url = self.jtools.stringFormat("{0}movie/now_playing?api_key={1}&page={2}",[api.link, process.env.MOVIEDB_KEY, items.page]);
                        break;
                    case "upcoming":
                        url = self.jtools.stringFormat("{0}movie/upcoming?api_key={1}&page={2}",[api.link, process.env.MOVIEDB_KEY, items.page]);
                        break;
                    case "tv_airing_today":
                        url = self.jtools.stringFormat("{0}tv/airing_today?api_key={1}&page={2}",[api.link, process.env.MOVIEDB_KEY, items.page]);
                        break;
                    default:
                        break;
                }

                if(api != null && url != null) {
                    console.log(url);

                    axios.get(url).then(function(dataRet){
                        if(dataRet.status == 200){
                            response.results = dataRet.data; 
                        }
                        else { 
                            response.error = "Issue retrieving tmdb list data";
                            log.error("tmdb list (E2): " + response.error);                             
                        }
                        callback(response);
                    }).catch(function(error){
                        response.error = "Issue Retrieving TMDB data (E1): " + error;
                        log.error(response.error); callback(response);
                    });
                }
                else {
                    response.error = "Unable to retrieve API data";
                    log.error(response.error); callback(response);
                }
            }
        }
        catch(ex){
            response.error = "Error retrieving the movie DB List";
            log.error(response.error);
            callback(response);
        }
    }
}

module.exports = JCELL;

/* Private Functions */

function checkParameterList(params, items){        
    for(var i =0; i < params.length; i++){
        if(!(params[i] in items)){ return false; }
    }
    return true;
}

function saveLastAction(method, userInfo, data) {
    var self = this, prevResponse = null;

    try {
        /* TO DO */
    }
    catch(ex){
        log.error(" [ERROR] Saving Last Action: " + ex);
    }

    return prevResponse;
}

function getApiItem(name){        
    return (name in apiLib ? apiLib[name] : null);
} 