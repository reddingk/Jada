var express = require('express');
var router = express.Router();
var talk = require('../services/talk.service');

/* Send Phrase Return Answer */
function convoRout(req, res){ 
    try {
        var input = (req.body && req.body.phrase ? req.body.phrase : 'hey');
        talk.postPhrase(input, function(ret){
            res.status(200).json(ret);
        });
    }
    catch(ex){
        res.status(200).json({"error":"Error talking to Jada: "+ ex });
    }
}

/* Phrase based conversation
    INPUT: { "phrase":"" }
    OUTPUT: { "jresponse":"", "japi":"" }
 */
router.post('/talk', convoRout);


module.exports = router;