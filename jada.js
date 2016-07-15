//var index = require('./index');
var brain = require('./jada_/jbrain');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.setPrompt('jada> ');
/*JADA implementation*/

rl.prompt();

rl.on('line', (input) => {
  //console.log(brain.talk(input.trim()));
  console.log(JSON.stringify(brain.talk( brain.clean(input.trim()) )));

  if(input == "exit"){
    console.log("Bye");
    rl.close();
  }
  else {
    rl.prompt();
  }

}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
