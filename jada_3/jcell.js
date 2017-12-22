'use strict';
/*
 * JADA CELL CLASS
 * By: Kris Redding
 */

const Tools = require('./jtools.js');

class JCELL {  
    constructor() {
        this.jtools = new Tools();
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
    
    
    /* private methods */
    checkParameterList(params, items){        
        for(var i =0; i < params.length; i++){
            if(!(params[i] in items)){
                return false;
            }
        }
        return true;
    }
}

module.exports = JCELL;