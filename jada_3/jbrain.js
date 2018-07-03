'use strict';

/*
 * JADA BRAIN CLASS
 * By: Kris Redding
 */
const Language = require('./jlanguage.js');
const Nerves = require('./jnerves.js');
var phraseDB = require('./config/models/phrases');

class JBRAIN {
    constructor() {
        this.settingFile = __dirname + '/config/settings.json';
        this.jlanguage = new Language();
        this.jNerves = new Nerves(this);
        this.jCells = this.jNerves.jnervesystem.jcell;
    }

    /* Functions */
    test(phrase) {
        console.log("You entered in " + phrase);
        phraseDB.find({ 'type' : 'phrase' }, function(err, res){
            console.log(" [2]>");
        });
    };

    polly(phrase) { console.log("You entered in " + phrase);};

    /* Jada conversation function */
    convo(phrase, callback) {
        var self = this;
        
        var tmpStr = phrase.split(" ");
        var phraseLibrary = null;
        var fullPhraseLibrary = null;
        
        self.dbActions(tmpStr, phrase, callback);
    }

    /* Direct Access to Functions */
    directData(functionName, items) {
      var self = this;
      var response = {};
      try {
        self.jCells[functionName](items, function(res){
            return res;
        });
      }
      catch(ex){
        response.error = "Error calling directData function: "+ ex;
        return response;
      }
    }

    /* Internal functions */
    /* Database Actions */
    dbActions(tmpStr, phrase, callback){
      var self = this;
      
      self.jlanguage.searchPhrase(tmpStr, function(res){
          // Check Full Phrases
          if(self.jlanguage.fullPhraseLib == null){
              self.jlanguage.getFullPhrases(function(fullres){
                  self.jlanguage.fullPhraseLib = fullres;

                  var response = self.jlanguage.getCall(phrase, res);

                  if(response != null){
                      phrase = ( response.response == "N/A" ? "" : phrase);
                      self.jNerves.dataResponse(response, phrase, function(res){ callback(res); });
                  }
              });
          }
          else {
              var response = self.jlanguage.getCall(phrase, res, callback);
              if(response != null){
                  phrase = ( response.response == "N/A" ? "" : phrase);
                  self.jNerves.dataResponse(response, phrase, function(res){ callback(res); });
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
