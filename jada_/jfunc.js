'use strict';

var jbrain = require('./jbrain');
var apiLib = require('./apiLib');
var nerves = require('./jnerves');
const Data = require('./jdata.js');
let data = new Data('../settings.json', false);

//
var fs = require('fs');
var os = require('os');
var http = require('http');
var opn = require('opn');
var underscore = require('underscore');
var md5 = require('md5');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

/*****Response Functions*****/

/*Greetings Function*/
exports.greetings = function greetings(main, additional, phrase, obj, callback) {

  var tmpStr = phrase.split(" ");
  var actionResponse = null;
  var removables = additional;
  removables.push(main);
  removables.push("Jada");
  var num = Math.floor((Math.random() * (data.greetings.length)));
  var persGreeting = nerves.stringFormat(data.greetings[num], [obj.name.nickname]);

  // Remove Greetings from phrase
  for(var i =0 ; i < removables.length; i++){
    var index = tmpStr.indexOf(removables[i]);
    if(index > -1) {
      tmpStr.splice(index,1).join(" ");
    }
  }

  if(tmpStr.length == 0) {
    callback({ "todo":"", "jresponse": persGreeting, "japi": {"results":persGreeting } });
  }
  else if(tmpStr == 1) {
    jbrain.Extalk(tmpStr[0], function(res){
      var finalResponse = persGreeting + ": " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse, "japi": {"results":res.japi } });
    });
  }
  else {
    jbrain.Extalk(tmpStr.join(" "), function(res){
      var finalResponse = persGreeting + ": " + res.jresponse;
      callback({ "todo":"", "jresponse": finalResponse, "japi": {"results":res.japi } });
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
exports.getChangedSetting = function getChangedSetting(item, phrase, obj, callback)
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

        apiResponse = {results: { "updated":true, "item":item, "newState":newitem}};
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

    console.log("Test 2-1");
    getIanaCode(fromWord, toWord, function(res) {

      console.log("Test 2");
      console.log(res);
      console.log("PHRASE: " + translatePhrase);

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


exports.getOSInfo = function getOSInfo(type, callback) {
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

/* Jada Easter Eggs*/
exports.easterEggs = function easterEggs(action, callback) {
  var apiResponse = null;
  var retPhrase = "";

  switch(action){
    case "do you know the muffin man":
      retPhrase = "yes, he lives in mulbery lane";
      apiResponse = { "results": "yes, he lives in mulbery lane"};
      break;
    case "how are you":
      // TODO: perform system diagnostic
      retPhrase = "great thanks for asking";
      apiResponse = { "results": "great thanks for asking"};
      break;
    default:
      apiResponse = {"code":-1};
      break;
  }
  callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
}

/* Get Personal Relationship Info*/
exports.getRelationship = function getRelationship(action, phrase, obj, callback) {

  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(action)+1);
  if(postPhrase.indexOf("my") > -1){
    postPhrase = postPhrase.slice(postPhrase.indexOf("my")+1);
  }
  var userRelationships = obj.relationships;

  var apiResponse = null;
  var retPhrase = "";


    if(action == "am") {
      retPhrase = nerves.stringFormat("You are {0} aka {1}", [obj.name.fullname, obj.name.nickname]);
      apiResponse = { "results": {"who": "Me", "relationships": obj.name }};
    }
    else if(action == "is" || action == "are"){
      if (postPhrase.length > 0) {
        // find relationships
        var relationships = [];
        var searchName = (postPhrase.join(" ").endsWith("'s") ? (postPhrase.join(" ")).substring(0, postPhrase.join(" ").length - 2) : postPhrase.join(" "));

        /*Types | 0:name -> title | 1: title -> name*/
        for(var i =0; i < userRelationships.length; i++){

          if(userRelationships[i].name.indexOf(searchName) > -1) {
            relationships.push({"type":0, "info":userRelationships[i]});
          }
          else if(underscore.filter(userRelationships[i].title, function(dt) {  return dt == searchName; }).length > 0 ){
            relationships.push({"type":1, "info":userRelationships[i]});
          }
        }

        // Build Relationship String
        if(relationships.length > 0){
          var relInfo = "";
          for(var j =0; j < relationships.length; j++){
            if(relationships[j].type == 0){
              relInfo += (relInfo == "" ? relationships[j].info.title[0] : ", "+relationships[j].info.title[0] )
            }
            else{
              relInfo += (relInfo == "" ? relationships[j].info.name : ", "+relationships[j].info.name )
            }
          }
          retPhrase = nerves.stringFormat("you told me your {0}{1} '{2}'",[postPhrase.join(" "), (relationships.length > 1 ? "'s are" : " is"), relInfo ]);
          apiResponse = { "results": {"who":postPhrase.join(" "), "relationships": relationships} };
        }
        else {
          retPhrase = nerves.stringFormat("sorry I don't think you told me about {0}.", [postPhrase.join(" ")]);
          apiResponse = {"code": -3};
        }
      }
      else {
        retPhrase = "sorry you didn't give me a name or nickname I could work with.";
        apiResponse = {"code": -4};
      }
    }
    else {
      apiResponse = {"code":-1};
  }

  callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
}

/* Get Personal Location Info*/
exports.getLocation = function getLocation(action, phrase, obj, callback) {

  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(action)+1);
  if(postPhrase.indexOf("my") > -1){
    postPhrase = postPhrase.slice(postPhrase.indexOf("my")+1);
  }
  var userLocations = obj.locations;

  var apiResponse = null;
  var retPhrase = "";

    if(action == "am") {
      apiLib.getIPLocation(function(res){
        if(res != null){
          retPhrase = nerves.stringFormat("You are currently located near {0}, {1}", [res.city, res.regionName]);
          apiResponse = { "results": {"where": "Me", "location": res }};
        }
        else{

        }
        callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
      });
    }
    else if(action == "is"){
      if (postPhrase.length > 0) {
        // find location
        var location = null;
        var searchName = postPhrase.join(" ");

        /*Types | 0:name -> title | 1: title -> name*/
        for(var i =0; i < userLocations.length; i++){
          if(userLocations[i].name.indexOf(searchName) > -1) {
            location = userLocations[i];
          }
        }

        // Build Location String
        if(location != null){
          retPhrase = nerves.stringFormat("you told me the address for {0} is '{1}'",[postPhrase.join(" "), location.address]);
          apiResponse = { "results": location };
        }
        else {
          retPhrase = nerves.stringFormat("sorry I don't think you told where {0} is located.", [postPhrase.join(" ")]);
          apiResponse = {"code": -3};
        }
      }
      else {
        retPhrase = "sorry you didn't give me a location name I could work with.";
        apiResponse = {"code": -4};
      }
      callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
    }
    else {
      apiResponse = {"code":-1};
      callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
  }
}


/* User Setting Data*/
exports.addUserSetting = function addSetting(action, phrase, obj, callback) {
  var apiResponse = null;
  var retPhrase = "";

  var tmpPhrase = phrase.split(" ");
  var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(action)+1);

  if(action == "location"){
    var asPos = postPhrase.indexOf("as");
    var newName = postPhrase.slice(0, asPos).join(" ");
    var newAddress = postPhrase.slice(asPos+1).join(" ");

    // Search for existing entry
    var existingLocation = underscore.filter(obj.locations, function(dt) {  return dt.name == newName; });
    if(existingLocation.length > 0 ) {
      retPhrase = nerves.stringFormat("You already have an address for {0} which is {1}, if you would like me to change it just ask me to 'replace'", [newName, existingLocation[0].address]);
      apiResponse = {"code": -5, "results":{ "newLocation":{"name":newName, "address":newAddress}, "currentLocation": existingLocation[0] }};
    }
    else {
      obj.locations.push( {"name":newName, "address":newAddress});
      // Add Location in DataFile
      fs.writeFileSync(data.userSettingsFile, JSON.stringify(obj), {"encoding":'utf8'});
      retPhrase = nerves.stringFormat("I will remember that location for {0}", [newName]);
      apiResponse = {"results": {"name":newName, "address":newAddress} };
    }
  }
  else if(action == "relationship") {
    var myPos = postPhrase.indexOf("my");
    var isPos = postPhrase.indexOf("is");

    if(isPos > -1 && myPos > -1){
      var newName = "";
      var newTitle = "";
      if(isPos < myPos){
        newName = postPhrase.slice(0, isPos).join(" ");
        newTitle = postPhrase.slice(myPos+1).join(" ");
      }
      else {
        newName = postPhrase.slice(isPos+1).join(" ");
        newTitle = postPhrase.slice(myPos+1, isPos).join(" ");
      }
      var existingRelationship = underscore.filter(obj.relationships, function(dt) {  return dt.name == newName; });
      if(existingRelationship.length > 0){
        // Update Exsisting Relationship
        existingTitle = underscore.filter(existingRelationship[0].title, function(dt) {  return dt == newTitle; });
        if(existingTitle.length > 0){
          retPhrase = nerves.stringFormat("You already told me that {0} is noted as {1}", [newName, newTitle]);
          apiResponse = {"code": -15, "results":{ "currentRelationship":existingRelationship[0] }};
        }
        else {
          var updatedRelationship = null;
          for(var i =0 ; i < obj.relationships.length; i++){
            if(obj.relationships[i].name == newName){
              obj.relationships[i].title.push(newTitle);
              updatedRelationship = obj.relationships[i];
              break;
            }
          }
          fs.writeFileSync(data.userSettingsFile, JSON.stringify(obj), {"encoding":'utf8'});
          retPhrase = nerves.stringFormat("I will remember that {0} is also your '{1}'", [newName, newTitle]);
          apiResponse = {"code": 12, "results":{ "currentRelationship":updatedRelationship }};
        }
      }
      else{
        // Add New Relationship
        obj.relationships.push( {"name":newName, "title":[newTitle]});
        // Add Relationship in DataFile
        fs.writeFileSync(data.userSettingsFile, JSON.stringify(obj), {"encoding":'utf8'});
        retPhrase = nerves.stringFormat("I will remember that {0} is your '{1}'", [newName, newTitle]);
        apiResponse = {"results": {"name":newName, "title":[newTitle]} };
      }
    }
  }

  callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
}
exports.replaceLastAction = function replaceLast(obj, prevResponse, callback) {

  if(prevResponse.response.action == "location"){
    var tmpPhrase = prevResponse.fullPhrase.split(" ");
    var postPhrase = tmpPhrase.slice(tmpPhrase.indexOf(prevResponse.response.action)+1);
    var asPos = postPhrase.indexOf("as");
    var newName = postPhrase.slice(0, asPos).join(" ");
    var newAddress = postPhrase.slice(asPos+1).join(" ");

    for(var i =0 ; i < obj.locations.length; i++){
      if(obj.locations[i].name == newName){
        obj.locations[i].address = newAddress;
        updatedRelationship = obj.locations[i];
        break;
      }
    }
    fs.writeFileSync(data.userSettingsFile, JSON.stringify(obj), {"encoding":'utf8'});
    retPhrase = nerves.stringFormat("I switched the location for {0} to {1}", [newName, newAddress]);
    apiResponse = {"results": {"action":"replaced", "name":newName, "address":newAddress} };
  }
  else {
    retPhrase = nerves.stringFormat("Sorry there is nothing to replace from your last request: '{0}'", [prevResponse.fullPhrase]);
    apiResponse = {"code": -1};
  }
  callback({"todo":"", "jresponse":retPhrase, "japi":apiResponse});
}

exports.replaceUserSetting = function replaceSetting(action, phrase, callback) {}

/*Search Marvels DB for a specific marvel character*/
exports.marvelCharacter = function marvelCharacter(phrase, callback) {
  var tmpPhrase = phrase.split(" ");
  var searchQuery = tmpPhrase.slice(tmpPhrase.indexOf("characters")+1);
  if(searchQuery.indexOf("for") > -1){
    searchQuery = searchQuery.slice(searchQuery.indexOf("for")+1);
  }

  var resPhrase = "";
  var apiResponse = null;
  apiLib.getMarvelCharacter(searchQuery.join(" "), function(res){
    if(res.data.results.length > 0){
      resPhrase =  nerves.stringFormat("According to Marvel '{0}': {1}", [res.data.results[0].name, getMarvelBio(res.data.results[0])]);
      apiResponse = {"results":res.data.results[0]};
    }
    else {
      resPhrase =  nerves.stringFormat("No Data Found for: {0}", [searchQuery.join(" ")]);
      apiResponse = {"code":-1};
    }
    callback({"todo":"", "jresponse": resPhrase, "japi": apiResponse});
  });
}

function getMarvelBio(data){
    var response = "";
    if(data.description == ""){
      response = nerves.stringFormat("has no official bio but has been apart of {0} comics, {1} series, & {2} stories according to the marvel universe", [data.comics.available, data.series.available, data.stories.available]);
      if(data.urls.length > 0){
        response += nerves.stringFormat(", for more information please checkout the following link: {0}", [data.urls[0].url]);
      }
    }
    else {
      response = data.description;
    }
    return response;
}
