var jbrain = require('./jbrain');

exports.getDataResponse = function dataResponse(response, fullPhrase) {
  var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};
  switch(response.response){
    case "N/A":
      break;
    case "greetings":
      finalResponse = greetings(response.action, response.additional_phrases, fullPhrase);
      break;
    case "getLocalTime":
      finalResponse = getLocalDateTime("time");
      break;
    case "getLocalDate":
      finalResponse = getLocalDateTime("date");
      break;
    case "getTimeZoneTime":
      break;
    case "getTimeZoneDate":
      break;
    case "getTastekidResults":
      break;
    default:
      finalResponse.jresponse = response.action
      break;
  }
  return finalResponse;
}


/*****Response Functions*****/

/*Greetings Function*/
function greetings(main, additional, phrase) {
  var tmpStr = phrase.split(" ");
  var actionResponse = null;
  var removables = additional;
  removables.push(main);
  removables.push("Jada");

  for(var i =0 ; i < removables.length; i++){
    var index = tmpStr.indexOf(removables[i]);
    if(index > -1) {
      tmpStr.splice(index,1).join(" ");
    }
  }
  if(tmpStr.length == 0) {
    actionResponse = { "todo":"", "jresponse":""};
  }
  else if(tmpStr == 1) {
    actionResponse = jbrain.talk(tmpStr[0]);
  }
  else {
    actionResponse = jbrain.talk(tmpStr.join(" "));
  }

  var finalResponse = "Hello Kris how are things treating you: " + actionResponse.jresponse;
  return { "todo":"", "jresponse": finalResponse }

}

/*Get Time Function*/
function getLocalDateTime(type) {
  var finalResponse = "";
  var date = new Date();

  switch(type){
    case "time":
      var h = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
      var m = (date.getMinutes() < 10 ? "0"+ date.getMinutes() : date.getMinutes());
      var timeDelim = (date.getHours() > 12 ? "pm" : "am");
      finalResponse = "The time according to this machine is " + h + ":" + m +" " + timeDelim;
      break;
    case "hour":
      var h = date.getHours();
      finalResponse = "It is hour number " + h + " of the day";
      break;
    case "minutes":
      var h = date.getHours();
      var m = date.getMinutes();
      finalResponse = "It is minutue number " + m + " in hour number " + h;
      break;
    case "date":
      var mon_str =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var day = date.getDate();
      var mon = date.getMonth();
      var yr = date.getFullYear();
      finalResponse = "The date acording to this machine is " + mon_str[mon] + " " + day + " " + yr;
      break;
    case "month":
      var mon_str =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var mon = date.getMonth();
      finalResponse = "The month is " + mon_str[mon];
      break;
    case "day":
      var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ]
      var name = weekday[d.getDay()];
      finalResponse = "Today is " + name;
      break;
    default:
      break;
  }

  return { "todo":"", "jresponse": finalResponse }

}
