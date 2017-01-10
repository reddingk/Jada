var jbrain = require('./jbrain');
var apiLib = require('./apiLib');
var nerves = require('./jnerves');
var data = require('./jdata');
//
var fs = require('fs');
var os = require('os');
var http = require('http');
var opn = require('opn');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

/*****Response Functions*****/

/*Greetings Function*/
exports.greetings = function greetings(main, additional, phrase, callback) {
  // Get User Personal Settings
  var obj = JSON.parse(fs.readFileSync(data.userSettingsFile,'utf8'));

  var tmpStr = phrase.split(" ");
  var actionResponse = null;
  var removables = additional;
  removables.push(main);
  removables.push("Jada");
  var num = Math.floor((Math.random() * (data.greetings.length-1)));
  var persGreeting = nerves.stringFormat(data.greetings[num], [obj.name.nickname]);

  // Remove Greetings from phrase
  for(var i =0 ; i < removables.length; i++){
    var index = tmpStr.indexOf(removables[i]);
    if(index > -1) {
      tmpStr.splice(index,1).join(" ");
    }
  }

  if(tmpStr.length == 0) {
    callback({ "todo":"", "jresponse": persGreeting });
  }
  else if(tmpStr == 1) {
    jbrain.Extalk(tmpStr[0], function(res){
      var finalResponse = persGreeting + ": " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse });
    });
  }
  else {
    jbrain.Extalk(tmpStr.join(" "), function(res){
      var finalResponse = persGreeting + ": " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse });
    });
  }
}


/*Get Time Function*/
exports.getLocalDateTime = function getLocalDateTime(type) {
  var finalResponse = "";
  var apiResponse = null;
  var date = new Date();

  switch(type){
    case "time":
      var h = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
      var m = (date.getMinutes() < 10 ? "0"+ date.getMinutes() : date.getMinutes());
      var timeDelim = (date.getHours() > 12 ? "pm" : "am");
      finalResponse = "The time according to this machine is " + h + ":" + m +" " + timeDelim;
      apiResponse = {"results": nerves.stringFormat("{0}:{1} {2}",[h,m, timeDelim])};
      break;
    case "hour":
      var h = date.getHours();
      finalResponse = "It is hour number " + h + " of the day";
      apiResponse = {"results": h};
      break;
    case "minutes":
      var h = date.getHours();
      var m = date.getMinutes();
      finalResponse = "It is minutue number " + m + " in hour number " + h;
      apiResponse = {"results": m};
      break;
    case "date":
      var mon_str =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var day = date.getDate();
      var mon = date.getMonth();
      var yr = date.getFullYear();
      finalResponse = "The date acording to this machine is " + mon_str[mon] + " " + day + " " + yr;
      apiResponse = {"results": nerves.stringFormat("{0} {1}, {2}",[mon_str[mon], day, yr]) };
      break;
    case "month":
      var mon_str =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var mon = date.getMonth();
      finalResponse = "The month is " + mon_str[mon];
      apiResponse = {"results": mon_str[mon]};
      break;
    case "day":
      var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ]
      var name = weekday[d.getDay()];
      finalResponse = "Today is " + name;
      apiResponse = {"results": name};
      break;
    default:
      break;
  }

  return { "todo":"", "jresponse": finalResponse, "japi": apiResponse}
}

/*Get Media Values based on Taste kid API*/
exports.getTastekidResults = function getTastekidResults(phrase, callback) {
  var objectList = ["media","books","movies","music","shows","games","authors"];
  var finalResponse = "";
  var apiResponse = null;
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
        apiResponse = null;
      }
      else if(results.Similar.Results.length == 0) {
       resPhrase =  "Sorry there are no media suggestions for " + results.Similar.Info[0].Name + ", maybe you have the wrong title?";
       apiResponse = {"items":results.Similar.Info, "results":[], "code":-2};
      }
      else {
        var itemList = "";
        var compList = "";
        for(var j =0; j < results.Similar.Info.length; j++)
        {
          compList += nerves.stringFormat("{0} ({1})",[results.Similar.Info[j].Name, results.Similar.Info[j].Type]);
          compList += (j+1 < results.Similar.Info.length ? " & " : "");
        }
        for(var j =0; j < results.Similar.Results.length; j++)
        {
          itemList += nerves.stringFormat("\n {0} ({1})", [results.Similar.Results[j].Name, results.Similar.Results[j].Type]);
          itemList += (j+1 < results.Similar.Results.length ? ", " : ".");
        }
        resPhrase = nerves.stringFormat("According to Tastekid for {0}. The following are sugguested that you checkout: {1}", [compList, itemList]);
        apiResponse = {"items":results.Similar.Info, "results":results.Similar.Results};
      }

      callback({"todo":"", "jresponse": resPhrase, "japi": apiResponse});
    });
}

/*getWeatherCurrent*/
exports.getWeatherCurrent = function getWeatherCurrent(phrase, callback){
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("weather"));
  var forIndex = postPhrase.indexOf("for");
  var apiResponse = null;

  if(forIndex >= 0)
  {
      var location = postPhrase.slice(forIndex+1).join(" ");
      apiLib.openweathermap("find", location,
        function(res)
        {
          var resPhrase = "";
          if(res.count > 0)
          {
            resPhrase = nerves.stringFormat("The current weather accourding to OpenWeather.com for {0} is: Tempurature of {1}, Humidity of {2}%, with a description of '{3}'", [res.list[0].name, res.list[0].main.temp, res.list[0].main.humidity, res.list[0].weather[0].description ]);
            apiResponse = {"results": res.list};
          }
          else {
            resPhrase = nerves.stringFormat("Sorry we could not find: {0} maybe you spelled it wrong?", [location]);
            apiResponse = {"item":location, "code":-3};
          }

          callback({"todo":"", "jresponse": resPhrase, "japi": apiResponse});
        });
  }
  else{
    // return null
    callback({"todo":"", "jresponse": "Im not sure where you would like me to look", "japi":{"code":-2} });
  }
}

/*getWeatherDetailedForecast*/
exports.getWeatherDetailedForecast = function getWeatherDetailedForecast(phrase, callback){
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("details"));
  var forIndex = postPhrase.indexOf("for");
  var apiResponse = null;

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
            apiResponse = {"results": res.list};
          }
          else {
            resPhrase = nerves.stringFormat("Sorry we could not find: {0} maybe you spelled it wrong?", [location]);
            apiResponse = {"item":location, "code":-3};
          }

          callback({"todo":"", "jresponse": resPhrase, "japi":apiResponse});
        });
  }
  else{
    // return null
    callback({"todo":"", "jresponse": "Im not sure where you would like me to look", "japi":{"code":-2}});
  }
}

/*getWeatherForecast*/
exports.getWeatherForecast = function getWeatherForecast(phrase, callback){
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("forecast"));
  var forIndex = postPhrase.indexOf("for");
  var apiResponse = null;

  if(forIndex >= 0)
  {
      var location = postPhrase.slice(forIndex+1).join(" ");

      apiLib.openweathermap("forecast", location,
        function(res)
        {
          var resPhrase = "";
          if(res.cnt > 0)
          {
            // Set initial parameters
            var dateString = (new Date(res.list[0].dt_txt)).toDateString();
            var dateNum = 0;
            var avgTemp = 0;
            var avgStatus = [];

            resPhrase = nerves.stringFormat("The weather forecast for the next few days accourding to OpenWeather.com for {0}: ",[res.city.name]);
            for(var i =0; i < res.list.length; i++)
            {
                var item = res.list[i];
                var newDate = (new Date(item.dt_txt)).toDateString();
                if(newDate != dateString )
                {
                  var dateStatus = {"name":"", "count":0 };
                  for(var k=0; k < avgStatus.length; k++){
                    if(avgStatus[k].count >= dateStatus.count)
                    { dateStatus = avgStatus[k]; }
                  }
                  resPhrase += nerves.stringFormat("\n |{0} : {1} degrees and '{2}' ", [dateString, (avgTemp / dateNum).toFixed(2), dateStatus.name]);

                  //Reset tmp Values
                  dateString = newDate;
                  avgTemp = 0;
                  avgStatus = [];
                  dateNum = 0;
                }
                else {
                  dateNum +=1.0;
                  avgTemp += parseFloat(item.main.temp_max);

                  if(avgStatus.length == 0){
                    avgStatus.push({"name":item.weather[0].main, "count": 1 });
                  }
                  else {
                    for(var j =0; j < avgStatus.length; j ++){
                      if(avgStatus[j].name == item.weather[0].main)
                      {
                        avgStatus[j].count += 1;
                        break;
                      }
                      else if( (j+1) >= avgStatus.length)
                      { avgStatus.push( {"name":item.weather[0].main, "count": 1 }); break;  }
                    }
                  }
                }
            }
            resPhrase += "\n";
            apiResponse = {"results": res.list};
          }
          else {
            resPhrase = nerves.stringFormat("Sorry we could not find: {0} maybe you spelled it wrong?", [location]);
            apiResponse = {"item":location, "code":-3};
          }

          callback({"todo":"", "jresponse": resPhrase, "japi":apiResponse});
        });
  }
  else{
    // return null
    callback({"todo":"", "jresponse": "Im not sure where you would like me to look", "japi":{"code":-2}});
  }
}

/* Change Settings in data file and return */
exports.getChangedSetting = function getChangedSetting(item, phrase, callback)
{
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("my"));
  var forIndex = postPhrase.indexOf("to");
  var retPhrase = "";
  var apiResponse = null;

  try {
    if(forIndex >= 0)
    {
        var newitem = postPhrase.slice(forIndex+1).join(" ");

        // Change Item
        var obj = JSON.parse(fs.readFileSync(data.userSettingsFile,'utf8'));

        switch(item){
          case "fullname":
            obj.name.fullname = newitem;
            break;
          case "nickname":
            obj.name.nickname = newitem;
            break;
          case "voice":
            obj.voice = (newitem == "on" ? "on": "off");
            break;
          default:
            break;
        }
        // Chang Setting in DataBase
        fs.writeFileSync(data.userSettingsFile, JSON.stringify(obj), {"encoding":'utf8'});

        apiResponse = {results: { "updated":true, "item":item, "newState":newItem}};
        retPhrase = nerves.stringFormat("'{0}' setting was updated to '{1}' smoothly", [item, newitem]);
    }
  }
  catch(ex){
    retPhrase = "You did not update your settings, Somthing went wrong sorry";
    apiResponse = {"code":-10, "errorMsg": ex};
  }

  callback({"todo":"", "jresponse": retPhrase, "japi":apiResponse});
}

exports.testCode = function testCode(phrase,callback)
{
  getIanaCode("english", "french", function(res) { console.log(res); callback({"todo":"", "jresponse":"FINISHED TEST"}); });
}

function getIanaCode(src, trg, callback) {
  var tags = require('language-tags');
  var codes = ["en","en"];

  var srcCmp = src.charAt(0).toUpperCase()+src.slice(1);
  var trgCmp = trg.charAt(0).toUpperCase()+trg.slice(1);

  apiLib.itranslate4(null, null, null,
    function(res) {
        var srcs = res.src;
        var trgs = res.trg;
        var loopParams = [(srcs.length > trgs.length? srcs.length : trgs.length), false, false]

        for(var i=0; i < loopParams[0]; i++) {
          // SRC
          if(i < srcs.length && !loopParams[1] && tags.language(srcs[i]).descriptions().indexOf(srcCmp) >= 0)
          {
            codes[0] = srcs[i];
            loopParams[1] = true;
          }
          // TRG
          if(i < trgs.length && !loopParams[2] && tags.language(trgs[i]).descriptions().indexOf(trgCmp) >= 0)
          {
            codes[1] = trgs[i];
            loopParams[2] = true;
          }
        }
        callback(codes);
  });
}

exports.getTranslation = function getTranslation(phrase, callback) {
  var returnTanslation = "Sorry I was not able to translate that for you";
  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf("translate"));

  var fromIndex = postPhrase.indexOf("from") + 1;
  var toIndex = postPhrase.indexOf("to") + 1;

  var apiResponse = null;

  if(fromIndex > -1 || toIndex > -1){
    var fromWord = (fromIndex > 0 ? postPhrase[fromIndex] : "english");
    var toWord = (toIndex > 0 ? postPhrase[toIndex] : "english");
    var translatePhrase = postPhrase.slice((toIndex > -1 ? toIndex : fromIndex) + 1).join("+");

    getIanaCode(fromWord, toWord, function(res) {
      apiLib.itranslate4(res[0], res[1], translatePhrase,
        function(res) {
          returnTanslation = nerves.stringFormat("The phrase \n {0} \nTranslated in {2} to: \n {1}",[translatePhrase.replace(/[+]/g, " "), res.dat[0].text[0], toWord]);
          apiResponse = {"results":{ "original":translatePhrase.replace(/[+]/g, " "), "lang":toWord, "translated":res.dat[0].text[0]}};

          callback({"todo":"", "jresponse":returnTanslation, "japi":apiResponse});
      });
    });
  }
  else { callback({"todo":"", "jresponse":returnTanslation, "japi":{"code":-2}}); }
}

exports.getDirections = function getDirections(phrase, callback) {
  var returnTanslation = "Sorry I was not able to get the directions for you";
  var tmpPhrase = phrase.split(" ");
  var dircIndex = tmpPhrase.indexOf("directions");
  var type = ( dircIndex > 0 ? tmpPhrase[dircIndex - 1] : "driving");
  var postPhrase = tmpPhrase.slice(dircIndex);
  var fromIndex = postPhrase.indexOf("from") + 1;
  var toIndex = postPhrase.indexOf("to") + 1;
  var apiResponse = null;

  if(fromIndex > -1 && toIndex > -1){
    var fromLoc = (fromIndex < toIndex ? postPhrase.slice(fromIndex, toIndex-1) : postPhrase.slice(fromIndex));
    var toLoc = (fromIndex < toIndex ? postPhrase.slice(toIndex) : postPhrase.slice(toIndex, fromIndex-1));
    var obj = JSON.parse(fs.readFileSync(data.userSettingsFile,'utf8'));

    for(var j in obj.locations)
    {
      var savedLoc = obj.locations[j];
      fromLoc = (fromLoc == savedLoc.name ? savedLoc.address.split(" ") : fromLoc);
      toLoc = (toLoc == savedLoc.name ? savedLoc.address.split(" ") : toLoc);
    }
    type = (type == "transit" ? "transit" :"driving");

    apiLib.googleDirections(type, fromLoc.join("+"), toLoc.join("+"), function(res) {
          if(res.status == "OK"){
              var legs = res.routes[0].legs[0];
              returnTanslation = nerves.stringFormat("It will take approximately {0} and {1} from '{2}' to '{3}': ", [legs.duration.text, legs.distance.text, legs.start_address, legs.end_address]);
              for(var i in legs.steps){
                var step = legs.steps[i];
                returnTanslation += nerves.stringFormat("\n\n ({0} : {1}) {2}",[step.distance.text, step.duration.text, step.html_instructions.replace(/<(.|\n)*?>/g, '')]);
              }
              apiResponse = {"results":legs};
          }
          callback({"todo":"", "jresponse":returnTanslation, "japi":apiResponse});
    });
  }
  else { callback({"todo":"", "jresponse":returnTanslation, "japi":{"code":-2}}); }
}


exports.getOSInfo = function testCode(type, callback)
{
  var retPhrase = "";
  var apiResponse = null;

  switch(type){
    case "arch":
      retPhrase = nerves.stringFormat("the cpu architecture is {0}",[os.arch()]);
      apiResponse = {"results":os.arch()};
      break;
    case "info":
      var cores = os.cpus();
      retPhrase = nerves.stringFormat("You have {0} cores on this machine, they are the following: ", [cores.length]);
      for(var i =0; i < cores.length; i++)
      { retPhrase += nerves.stringFormat("\n core {0}: {1}", [i, cores[i].model]);  }
      apiResponse = {"results":cores};
      break;
    case "hostname":
      retPhrase = nerves.stringFormat("the computers hostname is {0}",[os.hostname()]);
      apiResponse = {"results":os.hostname()};
      break;
    case "networkinterface":
      var network = os.networkInterfaces();
      var info = null;

      for(var i in network) {
        for(var j in network[i])
        {
          var iface = network[i][j];
          if(iface.family == "IPv4" && !iface.internal)
          {
            info = iface;
            break;
          }
        }
      }

      retPhrase = (info != null ? nerves.stringFormat("network information address: {0}, netmask: {1}, mac: {2}", [info.address, info.netmask, info.mac]) : "Sorry no network information");
      apiResponse = (info != null ? {"results":info} : {"code":-2});
      break;
    case "systemrelease":
      retPhrase = nerves.stringFormat("the operating system release is {0}",[os.release()]);
      apiResponse = {"results":os.release()};
      break;
    case "systemmemory":
      var memory = os.totalmem();
      var memPhrase  = "";

      if(memory > 1073741824) { memPhrase = nerves.stringFormat("{0} GB", [(memory/1073741824).toFixed(3) ]); }
      else if(memory > 1048576) { memPhrase = nerves.stringFormat("{0} MB", [(memory/1048576).toFixed(3) ]);  }
      else if(memory > 1024) { memPhrase = nerves.stringFormat("{0} KB", [(memory/1024).toFixed(3) ]) }
      else { memPhrase = nerves.stringFormat("{0} B",[memory]); }

      retPhrase = nerves.stringFormat("the amount of avaliable memory for the system is {0}",[memPhrase]);
      apiResponse = {"results":memPhrase};
      break;
    default:
      apiResponse = {"code":-1};
      break;
  }

  callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
}
