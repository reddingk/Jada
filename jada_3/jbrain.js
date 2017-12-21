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
        this.jNerves = new Nerves('../settings.json', this);           
    }

    /* Functions */

    polly(phrase) { console.log("You entered in " + phrase); };
    
    /* Jada conversation function */
    convo(phrase, callback) { 
        var self = this;

        var tmpStr = phrase.split(" ");  
        var phraseLibrary = null;
        var fullPhraseLibrary = null;

        self.jlanguage.searchPhrase(tmpStr, function(res){
            // Check Full Phrases    
            if(self.jlanguage.fullPhraseLib == null){
                self.jlanguage.getFullPhrases(function(fullres){ 
                    self.jlanguage.fullPhraseLib = fullres;     
                    var response = self.getCall(phrase, res);

                    if(response != null){
                        phrase = ( response.response == "N/A" ? "" : phrase);
                        self.jNerves.dataResponse(response, phrase, function(res){ callback(res); });
                    }
                });  
            }
            else {
                self.getCall(phrase, res, callback);
            }
        });
    }

    directData(){ }
}