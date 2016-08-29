var brain = require('./jada_/jbrain');
var data = require('./jada_/jdata');

var say = require('say');
var fs = require('fs');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.setPrompt('jada> ');
/*JADA implementation*/

rl.prompt();

rl.on('line', (input) => {

  brain.Extalk( brain.clean(input.trim()), function(res) {

    var output = res.jresponse;
    if(output != "")
    {
      console.log(output);
      var settings = JSON.parse(fs.readFileSync(data.userSettingsFile,'utf8'));

      if(settings.voice == "on") {
        var speechout = output.replace(/\n/g, " ");
        say.speak(speechout);
      }
    }

    if(input == "exit"){
      console.log("Bye");
      rl.close();
    }
    else {
      rl.prompt();
    }
  });

}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
