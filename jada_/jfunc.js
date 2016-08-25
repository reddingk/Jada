var jbrain = require('./jbrain');
var apiLib = require('./apiLib');
var q = require('q');

/*****Response Functions*****/

/*Greetings Function*/
exports.greetings = function greetings(main, additional, phrase, callback) {
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
    //actionResponse = { "todo":"", "jresponse":""};
    callback({ "todo":"", "jresponse": "Hello Kris how are things treating you: " });
  }
  else if(tmpStr == 1) {
    //actionResponse = jbrain.talk(tmpStr[0]);
    jbrain.Extalk(tmpStr[0], function(res){
      var finalResponse = "Hello Kris how are things treating you: " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse });
    });
  }
  else {
    //actionResponse = jbrain.talk(tmpStr.join(" "));
    jbrain.Extalk(tmpStr.join(" "), function(res){
      var finalResponse = "Hello Kris how are things treating you: " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse });
    });
  }

  //var finalResponse = "Hello Kris how are things treating you: " + actionResponse.jresponse;
  //return { "todo":"", "jresponse": finalResponse }
}

/*Get Time Function*/
exports.getLocalDateTime = function getLocalDateTime(type) {
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

/*Get Media Values based on Taste kid API*/
exports.getTastekidResults = function getTastekidResults(phrase, callback) {
  var objectList = ["media","books","movies","music","shows","games","authors"];
  var finalResponse = "";
  var mediaCompare = "";
  var object = "all";
  var limit = 10;

  // Parse phrase
  for(var i=0; i < objectList.length; i++)
  {
    var objectPos = phrase.indexOf(objectList[i]);
    var simPos = phrase.indexOf("similar to");
    if((objectPos >= 0 && simPos > 0) && objectPos < simPos)
    {
      var tmpStr = phrase.substring(simPos + 11).split(" ");
      // Set Parameteres
      mediaCompare = tmpStr.join('+');
      object = objectList[i];
      if(objectPos > 0)
      {
        var preObject = phrase.substring(0,objectPos).split(" ");
        for(var j=0; j < preObject.length ; j++)
        {
            if(!isNaN(parseInt(preObject[j])))
            {
              limit = parseInt(preObject[j]);
              break;
            }
        }
      }
      break;
    }
  }

  apiLib.tastekid(mediaCompare, object, 0, limit,
    function(response)
    {
      var results = response;
      var resPhrase = "";
      if(results == null) {
        resPhrase =  "Something is up with searching!";
      }
      else if(results.Similar.Results.length == 0) {
       resPhrase =  "Sorry there are no media suggestions for " + results.Similar.Info[0].Name + ", maybe you have the wrong title?";
      }
      else {
        var itemList = "";
        var compList = "";
        for(var j =0; j < results.Similar.Info.length; j++)
        {
          compList += results.Similar.Info[j].Name +" (" + results.Similar.Info[j].Type +")";
          compList += (j+1 < results.Similar.Info.length ? " & " : "");
        }
        for(var j =0; j < results.Similar.Results.length; j++)
        {
          itemList += results.Similar.Results[j].Name +" (" + results.Similar.Results[j].Type +")";
          itemList += (j+1 < results.Similar.Results.length ? ", " : ".");
        }
        resPhrase = "According to Tastekid for " + compList +".  The following are sugguested that you checkout: " + itemList;
      }

      callback({"todo":"", "jresponse": resPhrase});
    });
}
