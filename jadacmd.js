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
    
        jbrain.convo(input, {userId: 15, nickname: "Kris", token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZmI4YTM1MmM0NzRlMzJiZDhjYzZlNjEiLCJuYW1lIjoiS3JpcyBSZWRkaW5nIiwidXNlcklkIjoia3JlZGRpbmciLCJhZG1pbiI6dHJ1ZSwiZmFjZUlkIjoia3JlZGRpbmciLCJleHBEdCI6MTYxODk0ODkyNzA3NywiaWF0IjoxNjE4NTE2OTI3fQ.Wv7JhT52y70G8gNBYiTDR60Rwkcz-uu1rClJRfI6EAs"}, 
        function(res){
            //var output = res.jresponse + "\n";
            //console.log(output);
            console.log(res);
            process.exit(0);
        });
    }
}