var func = require('./cfunc');

exports.returnAction = function retAction(action, phrase, callback){
  if(action == null) { callback({"response": "N/A"}); }
  else {
    switch(action){
      case "cmdline":
        func.cmdline(phrase, function(res) { callback(res);} );
        break;
      default:
        break;
    }
  }
}

exports.stringFormat = function stringFormat(str, args) {
   var content = str;
   for (var i=0; i < args.length; i++)
   {
        var replacement = '{' + i + '}';
        content = content.replace(replacement, args[i]);
   }
   return content;
}
