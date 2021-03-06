'use strict';
require('dotenv').config();
var database = { connectionString: process.env.DatabaseConnectionString, dbName: process.env.DatabaseName }


const Brain = require('./jada_3/jbrain.js');
let jbrain = new Brain();

// build request
run(process.argv);

// run function
function run(args){    
    if(args.length <= 2) {
        console.log("Please enter a phrase to send to jada");
    }
    else {        
        var input = args.splice(2).join(" ");    
        var trimInput =   jbrain.jlanguage.cleanPhrase(input.trim());                

        jbrain.convo(trimInput, 'kredding', function(res){
            var output = res.jresponse + "\n";
            console.log(output);
            process.exit(0);
        });
    }
}