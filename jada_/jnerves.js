var jbrain = require('./jbrain');
var jfunc = require('./jfunc');

exports.getDataResponse = function dataResponse(response, fullPhrase, callback) {
  var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};

  if(response == null) { callback(finalResponse); }
  else {    
    switch(response.response){
      case "N/A":
        finalResponse.jresponse ="sorry I am unable to help you with that but I might one day";
        callback(finalResponse);
        break;
      case "greetings":
        jfunc.greetings(response.action, response.additional_phrases, fullPhrase, function(res){ callback(res);});
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
        jfunc.getChangedSetting("fullname", fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "changeNickname":
        jfunc.getChangedSetting("nickname", fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "changeVoice":
        jfunc.getChangedSetting("voice", fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "testCode":
        jfunc.testCode(fullPhrase, function(finalRes){ callback(finalRes); });
        break;
      case "translatePhrase":
        jfunc.getTranslation(fullPhrase, function(finalRes){ callback(finalRes); });
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
        jfunc.getRelationship(response.action, fullPhrase, function(res){ callback(res);});
        break;
      default:
        finalResponse.jresponse = response.action
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
