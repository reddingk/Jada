var nerves = require('./cnerves');

exports.parseAction = function action(phrase, callback){
  var tmpSplit = null;
  var action = null;
  var actionPhrase = null;

  if(phrase == undefined){
    callback({"response":"Response Error"});
  }
  else {
    tmpSplit = phrase.split("|:|");
    
    if(tmpSplit.length < 2){    callback({"response":"Command Error"});  }
    else {
      action = tmpSplit[0];
      actionPhrase = tmpSplit[1];

      nerves.returnAction(action, actionPhrase, function(res){ callback(res); });
    }
  }
}
