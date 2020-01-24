const Brain = require('../../jada_3/jbrain.js');
let jbrain = new Brain();

module.exports = {
    postPhrase: function(input, userId, callback){
        var trimInput =   jbrain.jlanguage.cleanPhrase(input.trim());

        jbrain.convo(trimInput, userId, callback(ret));
    }
}