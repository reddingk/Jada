const express = require('express');
const router = express.Router();
const Brain = require('../../jada_3/jbrain.js');

let jbrain = new Brain();
let auth = require('../services/auth.service');
let log = require("../services/log.service");

/* Send Phrase Return Answer */
function convoRout(req, res){ 
    try {
        if(req.headers && auth.paramCheck(["authorization"], req.headers) && req.body && auth.paramCheck(["phrase"], req.body)) {
            auth.authenticateJWTUser(req.headers.authorization, function(vRet){
                if(vRet.error){
                    log.error("Validating user: " + vRet.statusCode + " | " + vRet.status);
                    res.status(400).json({ "data": null, "error":vRet.error });
                }
                else {  
                    var input = (req.body && req.body.phrase ? req.body.phrase : 'hey');
                    var userInfo = {...vRet.results}; userInfo.token = req.headers.authorization;
                    jbrain.convo(input, userInfo, function(ret){
                        res.status(200).json(ret);
                    });
                }
            });
        }
        else {
            ret.error = "Invalid Header Params ";
            res.status(200).json(ret);
        }
    }
    catch(ex){
        log.error("with convoRout: " + ex);
        res.status(200).json({"error":"Error talking to Jada: "+ ex });
    }
}

/* Phrase based conversation
    INPUT: { "userId":"", "token":"", "phrase":"" }
    OUTPUT: { "jresponse":"", "japi":"" }
 */
router.post('/talk', convoRout);

module.exports = router;