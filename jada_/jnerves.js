'use strict';
/*
 * JADA NERVES CLASS
 * By: Kris Redding
 */

var fs = require('fs');
const Func = require('./jfunc.js');

class JNERVES {
  constructor(settingFile, brain){
    this.settingFile = settingFile;
    this.jfunc = new Func(brain);
  }

  stringFormat(str, args) {
      var content = str;
      for (var i=0; i < args.length; i++){
          var replacement = '{' + i + '}';
          content = content.replace(replacement, args[i]);
      }
      return content;
  }

  dataResponse(response, fullPhrase, callback) {
    var self = this;
    var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};       

    if(response == null) { callback(finalResponse); }
    else {
      // Add last response
      var obj = JSON.parse(fs.readFileSync(self.settingFile,'utf8'));
      var prevResponse = obj.lastAction;
      obj.lastAction = {"response":response, "fullPhrase":fullPhrase};
      fs.writeFileSync(self.settingFile, JSON.stringify(obj), {"encoding":'utf8'});  
      
      switch(response.response){
        case "N/A":
          finalResponse.jresponse ="sorry I am unable to help you with that but I might one day";
          callback(finalResponse);
          break;
        case "greetings":
          self.jfunc.greetings(response.action, response.additional_phrases, fullPhrase, obj, function(res){ callback(res);});
          break;
        case "getLocalTime":
          finalResponse = self.jfunc.getLocalDateTime("time");
          callback(finalResponse);
          break;
        case "getLocalDate":
          finalResponse = self.jfunc.getLocalDateTime("date");
          callback(finalResponse);
          break;
        case "getTimeZoneTime":
          break;
        case "getTimeZoneDate":
          break;
        case "getTastekidResults":
          self.jfunc.getTastekidResults(fullPhrase, function(finalRes){ callback(finalRes); });
          break;
        case "getWeatherCurrent":
          self.jfunc.getWeatherCurrent(fullPhrase, function(finalRes){ callback(finalRes); });
          break;
        case "getWeatherForecast":
          self.jfunc.getWeatherForecast(fullPhrase, function(finalRes){ callback(finalRes); });
          break;
        case "getWeatherDetailedForecast":
          self.jfunc.getWeatherDetailedForecast(fullPhrase, function(finalRes){ callback(finalRes); });
          break;
        case "changeFullName":
          self.jfunc.getChangedSetting("fullname", fullPhrase, obj, function(finalRes){ callback(finalRes); });
          break;
        case "changeNickname":
          self.jfunc.getChangedSetting("nickname", fullPhrase, obj, function(finalRes){ callback(finalRes); });
          break;
        case "changeVoice":
          self.jfunc.getChangedSetting("voice", fullPhrase, obj, function(finalRes){ callback(finalRes); });
          break;
        case "testCode":
          self.jfunc.testCode(fullPhrase, function(finalRes){ callback(finalRes); });
          break;
        case "translatePhrase":
          //self.jfunc.getTranslation(fullPhrase, function(finalRes){ callback(finalRes); });
          callback({ "todo":"", "jresponse": "Translation is currently unavaliable"});
          break;
        case "getDirections":
          self.jfunc.getDirections(fullPhrase, function(finalRes){ callback(finalRes); });
          break;
        case "getCpuArch":
          self.jfunc.getOSInfo("arch", function(finalRes){ callback(finalRes); });
          break;
        case "getCpuInfo":
          self.jfunc.getOSInfo("info", function(finalRes){ callback(finalRes); });
          break;
        case "getComputerHostname":
          self.jfunc.getOSInfo("hostname", function(finalRes){ callback(finalRes); });
          break;
        case "getNetworkInterface":
          self.jfunc.getOSInfo("networkinterface", function(finalRes){ callback(finalRes); });
          break;
        case "getSystemRelease":
          self.jfunc.getOSInfo("systemrelease", function(finalRes){ callback(finalRes); });
          break;
        case "getSystemMemory":
          self.jfunc.getOSInfo("systemmemory", function(finalRes){ callback(finalRes); });
          break;
        case "easterEggs":
          self.jfunc.easterEggs(response.action, function(res){ callback(res);});
          break;
        case "relationshipGuide":
          self.jfunc.getRelationship(response.action, fullPhrase, obj, function(res){ callback(res);});
          break;
        case "locationGuide":
          self.jfunc.getLocation(response.action, fullPhrase, obj, function(res){ callback(res);});
          break;
        case "addUserSetting":
          self.jfunc.addUserSetting(response.action, fullPhrase, obj, function(res){ callback(res);});
          break;
        case "replaceLastAction":
          self.jfunc.replaceLastAction(obj, prevResponse, function(res){ callback(res);});
          break;
        case "replaceUserSetting":
          self.jfunc.replaceUserSetting(response.action, fullPhrase, function(res){ callback(res);});
          break;
        case "marvelCharacter":
          self.jfunc.marvelCharacter(fullPhrase, function(res){ callback(res);});
          break;
        default:
          finalResponse.jresponse = "I feel like you were close to asking me something, you may be missing something when you mentioned '" + response.action+"'. ";
          callback(finalResponse);
          break;
      }
    }
  
  }
}

module.exports = JNERVES;