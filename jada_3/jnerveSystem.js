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
        self.jcell.getLocalDateTime({"type":"date"},
            function(res){
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
}


module.exports = JNERVESYSTEM;