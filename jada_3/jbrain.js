'use strict';

const Language = require('./jlanguage.js');
const log = require('../server/services/log.service');
const dbauth = require('../server/services/auth.service');

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

    /* Direct Access to Functions */
    directData(userToken, functionName, items, callback) {
        var self = this, response = {};
        try {
            dbauth.authenticateJWTUser(userToken, function(ret){
                if(ret.error){
                    log.error("Authenticating Users: " + ret.error); socket.disconnect(true);
                    callback({ error:"Error Authenticating Users: " + ret.error });
                }
                else if(!ret.status){
                    log.warning("User Not Valid "); socket.disconnect(true);
                    callback({ error:"User Not Valid" });
                }
                else if(functionName in self.jCells){
                    self.jCells[functionName](items, ret.results, function(res){ callback(res); });
                }
                else {
                    callback({ error:"Invalid Function Name" });
                }   
            });     
        }
        catch(ex){
          response.error = "Error calling directData function: "+ ex;
          log.error(response.error); callback(response);
        }
      }
}

module.exports = JBRAIN;