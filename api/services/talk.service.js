const Brain = require('../../jada_3/jbrain.js');
let jbrain = new Brain();

module.exports = {
    postPhrase: function(req, res){
        var input = (req.body && req.body.phrase ? req.body.phrase : 'hey');
        var trimInput =   jbrain.jlanguage.cleanPhrase(input.trim());

        jbrain.convo(trimInput, function(ret){
            res.status(200).json(ret);
        });
    }
}