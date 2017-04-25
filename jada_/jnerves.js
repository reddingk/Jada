var jbrain = require('./jbrain');
var jfunc = require('./jfunc');
var data = require('./jdata');
var fs = require('fs');


exports.getDataResponse = function dataResponse(response, fullPhrase, callback) {
  var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};

  if(response == null) { callback(finalResponse); }
  else {
    // Add last response
    var obj = JSON.parse(fs.readFileSync(data.userSettingsFile,'utf8'));
    var prevResponse = obj.lastAction;
    obj.lastAction = {"response":response, "fullPhrase":fullPhrase};
    fs.writeFileSync(data.userSettingsFile, JSON.stringify(obj), {"encoding":'utf8'});

    switch(response.response){
      case "N/A":
        finalResponse.jresponse ="sorry I am unable to help you with that but I might one day";
        callback(finalResponse);
        break;
      case "greetings":
        jfunc.greetings(response.action, response.additional_phrases, fullPhrase, obj, function(res){ callback(res);});
        break;
      case "getLocalTime":
        finalResponse = jfunc.getLocalDateTime("time");
        callback(finalResponse);
        break;
      case "getLocalDate":
        finalResponse = jfunc.getLocalDateTime("date");
        callback(finalResponse);
        break;
      case "getTimeZoneTime":
        break;
      case "getTimeZoneDate":
        break;
      case "getTastekidResults":
        jfunc.getTastekidResults(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "getWeatherCurrent":
        jfunc.getWeatherCurrent(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "getWeatherForecast":
        jfunc.getWeatherForecast(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "getWeatherDetailedForecast":
        jfunc.getWeatherDetailedForecast(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "changeFullName":
        jfunc.getChangedSetting("fullname", fullPhrase, obj, function(finalRes){ callback(finalRes); });
        break;
      case "changeNickname":
        jfunc.getChangedSetting("nickname", fullPhrase, obj, function(finalRes){ callback(finalRes); });
        break;
      case "changeVoice":
        jfunc.getChangedSetting("voice", fullPhrase, obj, function(finalRes){ callback(finalRes); });
        break;
      case "testCode":
        jfunc.testCode(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "translatePhrase":
        //jfunc.getTranslation(fullPhrase, function(finalRes){ callback(finalRes); });
        callback({ "todo":"", "jresponse": "Translation is currently unavaliable"});
        break;
      case "getDirections":
        jfunc.getDirections(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "getCpuArch":
        jfunc.getOSInfo("arch", function(finalRes){ callback(finalRes); });
        break;
      case "getCpuInfo":
        jfunc.getOSInfo("info", function(finalRes){ callback(finalRes); });
        break;
      case "getComputerHostname":
        jfunc.getOSInfo("hostname", function(finalRes){ callback(finalRes); });
        break;
      case "getNetworkInterface":
        jfunc.getOSInfo("networkinterface", function(finalRes){ callback(finalRes); });
        break;
      case "getSystemRelease":
        jfunc.getOSInfo("systemrelease", function(finalRes){ callback(finalRes); });
        break;
      case "getSystemMemory":
        jfunc.getOSInfo("systemmemory", function(finalRes){ callback(finalRes); });
        break;
      case "easterEggs":
        jfunc.easterEggs(response.action, function(res){ callback(res);});
        break;
      case "relationshipGuide":
        jfunc.getRelationship(response.action, fullPhrase, obj, function(res){ callback(res);});
        break;
      case "locationGuide":
        jfunc.getLocation(response.action, fullPhrase, obj, function(res){ callback(res);});
        break;
      case "addUserSetting":
        jfunc.addUserSetting(response.action, fullPhrase, obj, function(res){ callback(res);});
        break;
      case "replaceLastAction":
        jfunc.replaceLastAction(obj, prevResponse, function(res){ callback(res);});
        break;
      case "replaceUserSetting":
        jfunc.replaceUserSetting(response.action, fullPhrase, function(res){ callback(res);});
        break;
      case "marvelCharacter":
        jfunc.marvelCharacter(fullPhrase, function(res){ callback(res);});
        break;
      default:
        finalResponse.jresponse = "I feel like you were close to asking me something, you may be missing something when you mentioned '" + response.action+"'. ";
        callback(finalResponse);
        break;
    }
  }

}

exports.stringFormat = function stringFormat(str, args) {
   var content = str;
   for (var i=0; i < args.length; i++)
   {
        var replacement = '{' + i + '}';
        content = content.replace(replacement, args[i]);
   }
   return content;
}
