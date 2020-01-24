'use strict';

const Brain = require('./jada_3/jbrain.js');
let jbrain = new Brain();

var say = require('say');
var fs = require('fs');

// configuration
require('dotenv').config();

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var settings = jbrain.jCells.jtools.getUserData('kredding');

if(settings.voice == "on") {rl.setPrompt('|jada| -v- > '); }
else {rl.setPrompt('|jada| --- > '); }

/*JADA implementation*/
rl.prompt();

rl.on('line', (input) => {

  jbrain.convo(jbrain.jlanguage.cleanPhrase(input.trim()), 'kredding', function(res) {
    var output = res.jresponse + "\n";
    if(output != "") {
      console.log(output);
      settings = jbrain.jCells.jtools.getUserData('kredding');
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
