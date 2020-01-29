'use strict';

const util = require('util');
const bcrypt = require('bcrypt');
const UIDGenerator = require('uid-generator');
const underscore = require('underscore');
const fs = require('fs');

require('dotenv').config();

const Eyes = require('../../jada_3/jeyes');
const Tools = require('../../jada_3/jtools');

/* Class Decleration */
const jEyes = new Eyes();
const jTools = new Tools();

const uidgen = new UIDGenerator(); 
const saltRounds = 15;

var auth = {
    createUser: function(userInfo, userSettings, callback){
        var self = this;
        try {
            /* { userId, pwd, name, faceId } */
            _getUserByUId(userInfo.userId, function(res){
                if(res){
                    callback({"error":"User Already Exists"});
                }
                else {
                    _addUser(userInfo, userSettings, callback);
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

            if(connections != null){
                var connectionId = connections.getConnection(token);

                callback({"status":(connectionId ? true : false), "statusCode":1, "userId": connectionId });                
            }
            else {
                // Search DB
                _getUserByUId(user.userId, function(res){ 
                    if(!res) {
                        callback({"status":"user not found", "statusCode":-1, "user": null });
                    }
                    else if(user.uid != res.uid) {
                        callback({"status":"invalid id", "statusCode":-2, "user": null });
                    }
                    else {
                        callback({"status":"valid", "statusCode":1, "user": res });
                    }
                });
            }            
        }
        catch(ex){
            var err = util.format("Error Validating: %s", ex);
            console.log(err);
            callback({"status":err, "statusCode":0, "user":null });
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
function _getUserByUId(uID, callback){
    try {
        var db = jTools.getDBData("db");
        var ret = underscore.where(db.users, {userId: uID});
        callback((ret ? ret[0] : null));
    }
    catch(ex){
        console.log("Error Getting User ", uID," :", ex);
        callback(null);
    }
}

/* Get User From DB */
function _getUserByFacename(facename, callback){
    try {
        var db = jTools.getDBData("db");
        var ret = underscore.where(db.users, {faceId: facename});
        callback((ret ? ret[0] : null));
    }
    catch(ex){
        console.log("Error Getting User By Facename ", facename," :", ex);
        callback(null);
    }
}

/* Add User to DB */
function _addUser(userInfo, userSettings, callback){
    try {
        var db = jTools.getDBData("db");
        var ret = underscore.where(db.users, {userId: userInfo.userId});

        if(ret && ret.length > 0){
            callback({"status":false, "error":"User Already Exists" });
        }
        else {          
            var tmpId = 0;
            while(tmpId == 0 || underscore.where(db.users, {id: tmpId}).length > 0) {
                tmpId = Math.floor(Math.random() * Math.floor(process.env.MAXID));
            }
            
            // Hash PWD
            var pwdHash = bcrypt.hashSync(userInfo.pwd, saltRounds);
            
            // Add User 
            db.users.push({"id":tmpId, "userId":userInfo.userId, "pwd":pwdHash, "name":userInfo.name, "faceId":userInfo.faceId });
            var tmpStatus = jTools.setDBData("db", db);

            // Add User Settings
            var settingsUpdate = jTools.updateUserData(userInfo.userId, userSettings);

            callback({ "status":(tmpStatus && settingsUpdate) });  
        }
    }
    catch(ex){
        var err = util.format("Error Adding User [%s] : %s", userInfo.userId , ex);
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
        _getUserByUId(user, function(res){
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
