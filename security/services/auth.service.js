'use strict';

const util = require('util');
const bcrypt = require('bcrypt');
const UIDGenerator = require('uid-generator');
var underscore = require('underscore');

require('dotenv').config();
const db = require(process.env.CONFIG_LOC + "/db.json");

const Eyes = require('../../jada_3/jeyes');

/* Class Decleration */
const jEyes = new Eyes();

const uidgen = new UIDGenerator(); 
const saltRounds = 15;

var auth = {
    createUser: function(user, password, name, connections, callback){
        var self = this;
        try {
            _getUserByUname(user, function(res){
                if(res){
                    callback({"error":"User Already Exists"});
                }
                else {
                    var pwdHash = bcrypt.hashSync(password, saltRounds);
                    _addUser(user, pwdHash, name, callback);
                }
            }); 
        }
        catch(ex){
            var err = util.format("Error Creating %s On: %s", user, ex);
            console.log(err);
            callback({"error":err});
        }
    },
    loginUser: function(user, password, ip, connections, callback){
        var self = this;
        try {
            _loginUser(user, password, ip, connections, callback);       
        }
        catch(ex){
            var err = util.format("Error Logging %s On: %s", user, ex);
            console.log(err);
            callback({"error":err});
        }
    },
    logOffUser: function(id, connections, callback){
        try {
            callback({"status":connections.removeConnection(id)});
        }
        catch(ex){
            var err = util.format("Error Logging %s Off: %s", user, ex);
            console.log(err);
            callback({"status":false, "errorMsg":err});
        }
    },
    validateUser: function(user, token, connections, callback){
        try {
            // test
            callback({"status":"Valid", "statusCode":1});

            if(connections == null){
                var connectionId = connections.getConnection(token);

                callback({"status":(connectionId ? true : false), "statusCode":1, "userId": connectionId });                
            }
            else {
                // Search DB
                _getUserByUname(user.uname, function(res){ 
                    if(!res) {
                        callback({"status":false, "statusCode":-1, "userId": null });
                    }
                    else if(user.uid != res.uid) {
                        callback({"status":false, "statusCode":-1, "userId": null });
                    }
                    else {
                        callback({"status":true, "statusCode":1, "userId": res });
                    }
                });
            }            
        }
        catch(ex){
            var err = util.format("Error Validating: %s", ex);
            console.log(err);
            callback({"status":err, "statusCode":0});
        }
    },
    authSwitch(userObj, connections, ip, callback){
        try {
            if(userObj){
                switch(userObj.type){
                    case 'faceMatch':
                        _faceMatchUser(userObj, callback);
                        break;
                    case 'userLogin':
                        if(userObj.data){
                            _loginUser(userObj.data.userId, userObj.data.password, ip, connections, callback)
                        }
                        break;
                    default:
                        break;
                }
            }
            else {
                callback({"status":"Invalid Auth Object", "statusCode":- 23});
            }
        }
        catch(ex){
            var err = util.format("Error Authetication User: %s", ex);
            console.log(err);
            callback({"status":err, "statusCode":0});
        }
    }
}

module.exports =  auth;

/* Get User From DB */
function _getUserByUname(uname, callback){
    try {
        var ret = underscore.where(db.users, {userId: uname});
        callback((ret ? ret[0] : null));
    }
    catch(ex){
        console.log("Error Getting User ", uname," :", ex);
        callback(null);
    }
}

/* Get User From DB */
function _getUserByFacename(facename, callback){
    try {
        var ret = underscore.where(db.users, {faceId: facename});
        callback((ret ? ret[0] : null));
    }
    catch(ex){
        console.log("Error Getting User By Facename ", facename," :", ex);
        callback(null);
    }
}

/* Add User to DB */
function _addUser(uname, pwd, name, callback){
    try {
        var ret = underscore.where(db.users, {userId: uname});
        
        if(ret){
            callback({"status":false });
        }
        else {
            var tmpId = 0;
            while(tmpId == 0 || underscore.where(db.users, {id: tmpId})) {
                tmpId = Math.floor(Math.random() * Math.floor(process.env.MAXID));
            }
            // Add User 
            db.users.push({"id":tmpId, "userId":uname, "pwd":pwd, "name":name, "faceId":null });
            callback({"status":true});  
        }
    }
    catch(ex){
        var err = util.format("Error Adding User [%s] : %s",uname, ex);
        console.log(err);
        callback({"error":err, "status":false});
    }
}

function _faceMatchUser(userObj, callback){
    try {        
        var matchNames = _getFaceRecogUsers(userObj.data);
        
        if(matchNames && matchNames.length > 0){
            _getUserByFacename(matchNames[0], function(ret){
                var retObj = (ret != null ? {"userId":ret.userId, "name":ret.name} : {"status":"no active user match", "statusCode":3});
                callback(retObj);
            });
        }
        else {
            callback({"status":"no user found", "statusCode":2, "userId":null});
        }
    }
    catch(ex){
        var err = util.format("Error Matching User: %s", ex);
        console.log(err);
        callback({"status":err, "statusCode":0});
    }
}

/* Face Recog Img */
function _getFaceRecogUsers(img){
    var retData = null;
    try {
        var matImg = jEyes.b64toMat(img);        
        retData = (matImg != null ? jEyes.faceRecogImg(matImg) : null);   
    }
    catch(ex){
        console.log("Error FaceRecog Service:", ex);
        retData = null;
    }
    
    return (retData != null? retData.names : []);
}

/* Login User */
function _loginUser(user, password, ip, connections, callback){
    try {
        _getUserByUname(user, function(res){
            if(!res){
                callback({"error":"Invalid User"});
            }
            else {
                //console.log(" [Debug PWD]: ", bcrypt.hashSync(password, saltRounds));
                bcrypt.compare(password, res.pwd, function(err, resCmp){
                    if(resCmp){
                        var token = uidgen.generateSync();
                        connections.addConnection(res.userId, null, res.name, token);
                        connections.updateIPLocation(res.userId, ip);
                        
                        callback({"_id":res._id, "userId":res.userId, "name":res.name, "token":token});
                    }
                    else {
                        callback({"error":"Invalid Password"})
                    }
                });
            }
        });       
    }
    catch(ex){
        var err = util.format("Error Login In User: %s", ex);
        console.log(err);
        callback({"status":err, "statusCode":0});
    }
}
