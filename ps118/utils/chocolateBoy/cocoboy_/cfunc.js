var cmd = require('node-cmd');


exports.cmdline = function cmdLine(phrase, callback){
  cmd.get(phrase, function(data){
    console.log("CMD LINE: " + phrase);
    console.log(data);

    callback({"response":data});
  });
}
