'use strict';
/*
 * JADA NERVES CLASS
 * By: Kris Redding
 */

var fs = require('fs');

const NerveSystem = require('./jnerveSystem.js');

class JNERVES {
    constructor(brain){
      this.settingFile = brain.settingFile;
      this.jnervesystem = new NerveSystem(brain);
    }

    dataResponse(response, fullPhrase, callback) {
        var self = this;
        var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};

        if(response == null) { callback(finalResponse); }
        else{
            response.fullPhrase = fullPhrase;
            var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));

            response.obj = obj;
            response.prevResponse = response.obj.lastAction;
            response.obj.lastAction = {"response":response, "fullPhrase":fullPhrase};
            //fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});
            
            if(!(response.response in self.jnervesystem)){
                finalResponse.jresponse = "I feel like you were close to asking me something, you may be missing something when you mentioned '" + response.action+"'. ";
                callback(finalResponse);
            }
            else {
                self.jnervesystem[response.response](response, function(finalRes){ callback(finalRes); });
            }
        }
    }
}


module.exports = JNERVES;