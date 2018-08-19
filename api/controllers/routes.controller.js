var express = require('express');
var router = express.Router();
var talk = require('../services/talk.service');


/* Send Phrase Return Answer */
function convoRout(req, res){ talk.postPhrase(req, res); }

/* Phrase based conversation
    INPUT: { "phrase":"" }
    OUTPUT: { "jresponse":"", "japi":"" }
 */
router.post('/talk', convoRout);
module.exports = router;