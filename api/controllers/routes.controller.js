var express = require('express');
var router = express.Router();
var talk = require('../services/talk.service');
// Auth Services
var jauth = require('../../security/services/auth.service');

/* Send Phrase Return Answer */
function convoRout(req, res){ 
    try {
        var userId = (req.body && req.body.userId ? req.body.userId : '');
        var token = (req.body && req.body.token ? req.body.token : '');

        jauth.validateUser(userId, token, null, function(vRet){
            if(vRet.statusCode > 0){
                var input = (req.body && req.body.phrase ? req.body.phrase : 'hey');
                talk.postPhrase(input, userId, function(ret){
                    res.status(200).json(ret);
                });
            }
            else {
                console.log("[Error] error validating user: ", vRet.statusCode, " | ",vRet.status );
                res.status(400).json({ "data": null, "statusCode":vRet.statusCode, "error":vRet.error });
            }
        });
    }
    catch(ex){
        console.log(" [ERROR] with convoRout: ", ex);
        res.status(200).json({"error":"Error talking to Jada: "+ ex });
    }
}

/* Add User */
function createUser(req,res){
    try {
        //jauth.validateUser(req.body.userId, req.body.token, null, function(vRet){
            vRet = { "statusCode": 1 };
            if(vRet.statusCode > 0){
                jauth.createUser(req.body.user, req.body.userSettings,function(userRet){
                    res.status(200).json({ "data": userRet });
                });
            }
            else {
                res.status(400).json({ "data": null, "statusCode":ret.statusCode, "error":ret.error });
            }
        //});
    }
    catch(ex){
        console.log(" [ERROR] creating user: ", ex);
        res.status(200).json({"error":"Error Creating User: "+ ex });
    }
}

/* Phrase based conversation
    INPUT: { "phrase":"" }
    OUTPUT: { "jresponse":"", "japi":"" }
 */
router.post('/talk', convoRout);

/* Create New User
    INPUT: { "userId":"", "user":{}, "userSettings":{} }
    OUTPUT: { "status":""}
 */
router.post('/createUser', createUser);


module.exports = router;