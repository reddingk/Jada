'use strict';

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
    
        jbrain.convo(input, {userId: 15, nickname: "Kris"}, function(res){
            //var output = res.jresponse + "\n";
            //console.log(output);
            console.log(res);
            process.exit(0);
        });
    }
}