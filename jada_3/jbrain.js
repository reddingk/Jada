'use strict';

const Language = require('./jlanguage.js');
const log = require('../server/services/log.service');


class JBRAIN {
    constructor() {
        this.jlanguage = new Language(this);
    }

    /* Functions */
    convo(phrase, userInfo, callback){
        var self = this;
        try{
            phrase = this.jlanguage.cleanPhrase(phrase);
            var tmpStr = phrase.split(" ");

            self.jlanguage.searchPhrase("search", tmpStr, function(res){                
                var response = self.jlanguage.getCall(phrase, res);
             
                if(response != null){
                    phrase = (response.response == "N/A" ? "" : phrase);
                    self.jlanguage.dataResponse(response, phrase, userInfo, function(res){ callback(res); });
                }
                else {
                    callback({"jresponse":" [Error] retrieving language call"});
                }
            });
        }
        catch(ex){
            log.error("during jbrain convo: " + ex);
            callback({"jresponse":" [Error] during jbrain convo"});
        }
    }
}

module.exports = JBRAIN;