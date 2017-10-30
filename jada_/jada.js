'use strict';

const Brain = require('./jbrain.js');
let jbrain = new Brain();

const Data = require('./jdata.js');
let jdata = new Data('../settings.json', false);

var say = require('say');
var fs = require('fs');
// configuration

// database config files
var mongoose = require('mongoose');
var database = require('./config/database');

mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrl);

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var settings = JSON.parse(fs.readFileSync(jdata.userSettingsFile,'utf8'));
if(settings.voice == "on") {rl.setPrompt('|jada| -v- > '); }
else {rl.setPrompt('|jada| --- > '); }

/*JADA implementation*/
rl.prompt();

rl.on('line', (input) => {

  jbrain.jConvo( jbrain.cleanPhrase(input.trim()), function(res) {

    var output = res.jresponse + "\n";
    if(output != "") {
      console.log(output);
      settings = JSON.parse(fs.readFileSync(jdata.userSettingsFile,'utf8'));
      // check voice setting to read to user
      if(settings.voice == "on") {
        var speechout = output.replace(/\n/g, " ");
        say.speak(speechout);
      }
    }

    // Exit or continue with command line utility
    if(input == "exit"){ console.log("Bye"); rl.close();  }
    else {
      if(settings.voice == "on") {rl.setPrompt('|jada| -v- > '); }
      else {rl.setPrompt('|jada| --- > '); }
      rl.prompt();
    }
  });

}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
