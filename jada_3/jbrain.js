'use strict';

/*
 * JADA BRAIN CLASS
 * By: Kris Redding
 */
const Language = require('./jlanguage.js');
const Nerves = require('./jnerves.js');

class JBRAIN {
    constructor() {        
        this.jlanguage = new Language();
        this.jNerves = new Nerves(this);
        this.jCells = this.jNerves.jnervesystem.jcell;
    }

    /* Functions */
    polly(phrase) { console.log("You entered in " + phrase);};

    /* Jada conversation function */
    convo(phrase, userId, callback) {
        var self = this;
        
        var tmpStr = phrase.split(" ");        
        self.dbActions(tmpStr, phrase, userId, callback);
    }

    /* Direct Access to Functions */
    directData(functionName, items, callback) {
      var self = this;
      var response = {};
      try {
        if(functionName in self.jCells){
          self.jCells[functionName](items, function(res){
            callback(res);
          });
        }
        else {
          callback({ error:"Invalid Function Name" });
        }        
      }
      catch(ex){
        response.error = "Error calling directData function: "+ ex;
        callback(response);
      }
    }

    /* Internal functions */
    /* Database Actions */
    dbActions(tmpStr, phrase, userId, callback){
      var self = this;
      
      self.jlanguage.searchPhrase(tmpStr, function(res){
          // Check Full Phrases
          if(self.jlanguage.fullPhraseLib == null){
              self.jlanguage.getFullPhrases(function(fullres){
                  self.jlanguage.fullPhraseLib = fullres;

                  var response = self.jlanguage.getCall(phrase, res);
                  
                  if(response != null){
                      phrase = ( response.response == "N/A" ? "" : phrase);
                      self.jNerves.dataResponse(response, phrase, userId, function(res){ callback(res); });
                  }
                  else {
                    callback({"jresponse":" [Error] retrieving language call"});
                  }
              });
          }
          else {
              var response = self.jlanguage.getCall(phrase, res, callback);
             
              if(response != null){
                  phrase = ( response.response == "N/A" ? "" : phrase);
                  self.jNerves.dataResponse(response, phrase, userId, function(res){ callback(res); });
              }
              else {
                callback({"jresponse":" [Error] retrieving language call"});
              }
          }
      });
    }

    /*Offline Actions */
    offlineActions(tmpStr, phrase, callback){
      var self= this;
      callback({"jresponse":"Sorry We were not able to connect to the DB"});
    }
}


module.exports = JBRAIN;
