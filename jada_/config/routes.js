'use strict';

var brain = require('../jbrain');
const Data = require('./jdata.js');
let data = new Data('../settings.json', false);

var JInput = require('./models/jInput');
var Phrases = require('./models/phrases');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

function talkToJada(req, res){
  var newInput = JInput(req.body);
  brain.Extalk( brain.clean(newInput.phrase.trim()), function(resp) {
    res.json(resp);
  });
}
function getPhraseLibrary(res){
  Phrases.find(function(err, phrases){
		if(err){ res.send(err); }
    //console.log(phrases);
		res.json(phrases);
	})
};

module.exports = function(app){
  // Get Phrases
  app.get('/jada/phrases', function (req, res) {
    getPhraseLibrary(res);
  });
  // Post Jada Talk Phrase
  app.post('/jada/talk', jsonParser, function (req, res){
    talkToJada(req, res);
  });
}
