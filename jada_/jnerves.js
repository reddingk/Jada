var jbrain = require('./jbrain');
var jfunc = require('./jfunc');

exports.getDataResponse = function dataResponse(response, fullPhrase, callback) {
  var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};

  if(response == null) { callback(finalResponse); }
  else {
    switch(response.response){
      case "N/A":
        finalResponse.jresponse ="";
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
