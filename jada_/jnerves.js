var jbrain = require('./jbrain');


exports.getDataResponse = function dataResponse(response, fullPhrase) {
  var finalResponse = { "todo":"", "jresponse": "I have nothing for you sorry"};
  switch(response.response){
    case "N/A":
      break;
    case "greetings":
      finalResponse = greetings(response.action, response.additional_phrases, fullPhrase);
      break;
    default:
      finalResponse.jresponse = response.action
      break;
  }
  return finalResponse;
}


/*Response Functions*/

/*Greetings Function*/
function greetings(main, additional, phrase) {
  var tmpStr = phrase.split(" ");
  var actionResponse = null;
  var removables = additional;
  removables.push(main);
  removables.push("Jada");

  for(var i =0 ; i < removables.length; i++){
    var index = tmpStr.indexOf(removables[i]);
    if(index > -1) {
      tmpStr.splice(index,1).join(" ");
    }
  }
  if(tmpStr.length == 0) {
    actionResponse = { "todo":"", "jresponse":""};
  }
  else if(tmpStr == 1) {
    actionResponse = jbrain.talk(tmpStr[0]);
  }
  else {
    actionResponse = jbrain.talk(tmpStr.join(" "));
  }

  var finalResponse = "Hello Kris how are things treating you: " + actionResponse.jresponse;
  return { "todo":"", "jresponse": finalResponse }

}
