var jbrain = require('./jbrain');
var apiLib = require('./apiLib');
var nerves = require('./jnerves');
var q = require('q');
var data = require('./jdata');

/*****Response Functions*****/

/*Greetings Function*/
exports.greetings = function greetings(main, additional, phrase, callback) {
  var tmpStr = phrase.split(" ");
  var actionResponse = null;
  var removables = additional;
  removables.push(main);
  removables.push("Jada");
  var num = Math.floor((Math.random() * (data.greetings.length-1)));

  for(var i =0 ; i < removables.length; i++){
    var index = tmpStr.indexOf(removables[i]);
    if(index > -1) {
      tmpStr.splice(index,1).join(" ");
    }
  }
  if(tmpStr.length == 0) {
    //actionResponse = { "todo":"", "jresponse":""};
    callback({ "todo":"", "jresponse": data.greetings[num] });
  }
  else if(tmpStr == 1) {
    //actionResponse = jbrain.talk(tmpStr[0]);
    jbrain.Extalk(tmpStr[0], function(res){
      var finalResponse = data.greetings[0] + ": " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse });
    });
  }
  else {
    //actionResponse = jbrain.talk(tmpStr.join(" "));
    jbrain.Extalk(tmpStr.join(" "), function(res){
      var finalResponse = data.greetings[0] + ": " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse });
    });
  }
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

/*getWeatherCurrent*/
exports.getWeatherCurrent = function getWeatherCurrent(phrase, callback){
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("weather"));
  var forIndex = postPhrase.indexOf("for");

  if(forIndex >= 0)
  {
      var location = postPhrase.slice(forIndex+1).join(" ");
      apiLib.openweathermap("find", location,
        function(res)
        {
          var resPhrase = "";
          if(res.count > 0)
          {
            resPhrase =nerves.stringFormat("The current weather accourding to OpenWeather.com for {0} is: Tempurature of {1}, Humidity of {2}%, with a description of '{3}'", [res.list[0].name, res.list[0].main.temp, res.list[0].main.humidity, res.list[0].weather[0].description ]);
          }
          else {
            resPhrase = nerves.stringFormat("Sorry we could not find: {0} maybe you spelled it wrong?", [location]);
          }

          callback({"todo":"", "jresponse": resPhrase});
        });
  }
  else{
    // return null
    callback({"todo":"", "jresponse": "Im not sure where you would like me to look"});
  }
}

/*getWeatherForecast*/
exports.getWeatherForecast = function getWeatherForecast(phrase, callback){
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("forecast"));
  var forIndex = postPhrase.indexOf("for");

  if(forIndex >= 0)
  {
      var location = postPhrase.slice(forIndex+1).join(" ");

      apiLib.openweathermap("forecast", location,
        function(res)
        {
          var resPhrase = "";
          if(res.cnt > 0)
          {
            var dateString = "";

            resPhrase = nerves.stringFormat("The weather forecast for the next few days accourding to OpenWeather.com for {0}: ",[res.city.name]);
            for(var i =0; i < res.list.length; i++)
            {
                var item = res.list[i];
                var newDate = new Date(item.dt_txt);
                if(newDate.toDateString() != dateString )
                {
                  dateString = newDate.toDateString();
                  resPhrase += nerves.stringFormat("\n\n|{0}\n [{1}]: {2} degrees and '{3}' ", [dateString, newDate.toLocaleTimeString(), item.main.temp_max, item.weather[0].description]);
                }
                else {
                  resPhrase += nerves.stringFormat("\n [{0}]: {1} degrees and '{2}' ", [newDate.toLocaleTimeString(), item.main.temp_max, item.weather[0].description]);
                }
            }
            resPhrase += "\n";
          }
          else {
            resPhrase = nerves.stringFormat("Sorry we could not find: {0} maybe you spelled it wrong?", [location]);
          }

          callback({"todo":"", "jresponse": resPhrase});
        });
  }
  else{
    // return null
    callback({"todo":"", "jresponse": "Im not sure where you would like me to look"});
  }
}
