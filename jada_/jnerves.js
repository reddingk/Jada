var jbrain = require('./jbrain');
var jfunc = require('./jfunc');
var q = require('q');

exports.getDataResponse = function dataResponse(response, fullPhrase, callback) {
  var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};
  switch(response.response){
    case "N/A":
      finalResponse.jresponse ="";
      callback(finalResponse);
      break;
    case "greetings":
      //finalResponse = jfunc.greetings(response.action, response.additional_phrases, fullPhrase, function(res){ callback(finalResponse);});
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
      //finalResponse = jfunc.getTastekidResults(fullPhrase);
      jfunc.getTastekidResults(fullPhrase, function(finalRes){ callback(finalRes); });
      break;
    default:
      finalResponse.jresponse = response.action
      callback(finalResponse);
      break;
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
