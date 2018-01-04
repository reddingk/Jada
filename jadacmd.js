'use strict';
var mongoose = require('mongoose');
var database = require('./jada_3/config/database');

mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrl, { useMongoClient: true });

const Brain = require('./jada_3/jbrain.js');
let jbrain = new Brain();

// build request
//console.log(process.argv);
run(process.argv);

// run function
function run(args){    
    if(args.length <= 2) {
        console.log("Please enter a phrase to send to jada");
    }
    else {        
        var input = args.splice(2).join(" ");    
        var trimInput =   jbrain.jlanguage.cleanPhrase(input.trim());                

        jbrain.convo(trimInput, function(res){
            var output = res.jresponse + "\n";
            console.log(output);
            process.exit(0);
        });
    }
}