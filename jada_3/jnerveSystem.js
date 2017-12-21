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

class JNERVESYSTEM {
    constructor(innerBrain){
        this.jbrain = innerBrain;
        this.jTools = new Tools();
        this.greetings = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today", "How's life", "How's your day treating you {0}"];
    }

    /* Greetings */
    greetings = function(response, callback){
        var self = this;

        var tmpStr = response.fullPhrase.split(" ");
        var actionResponse = null;
        var removables = response.additional_phrases;
        removables.push(response.action);
        removables.push("Jada");

        var num = Math.floor((Math.random() * (self.greetings.length)));
        var persGreeting = self.jtools.stringFormat(self.greetings[num], [obj.name.nickname]);
        
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
    getLocalTime = function(response, callback){
        var self = this;        
        var date = new Date();

        var h = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
        var m = (date.getMinutes() < 10 ? "0"+ date.getMinutes() : date.getMinutes());
        var timeDelim = (date.getHours() > 12 ? "pm" : "am");
        var finalResponse = "The time according to this machine is " + h + ":" + m +" " + timeDelim;
        var apiResponse = {"results": self.jtools.stringFormat("{0}:{1} {2}",[h,m, timeDelim])};

        callback({ "todo":"", "jresponse": finalResponse, "japi": apiResponse});
    }
}