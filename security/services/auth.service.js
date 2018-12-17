'use strict';

const util = require('util');
const bcrypt = require('bcrypt');
const UIDGenerator = require('uid-generator');
var database = require('../../jada_3/config/database');
var mongoClient = require('mongodb').MongoClient;
const mongoOptions = { connectTimeoutMS: 2000, socketTimeoutMS: 2000};
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
    loginUser: function(user, password, connections, callback){
        var self = this;
        try {
            _loginUser(user, password, connections, callback);       
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
            /*_getUserByUname(user, function(res){
                var conn = connections.getConnection(user);

                if(!res) {
                    callback({"status":"Invalid User", "statusCode":-1});
                }
                else if(!conn){
                    callback({"status":"User Not Connected", "statusCode":-2});
                }
                else if(token != conn.token){
                    callback({"status":"Invalid Token", "statusCode":-3});
                }
                else {
                    callback({"status":"Valid", "statusCode":1});
                }                
            });*/
        }
        catch(ex){
            var err = util.format("Error Validating: %s", ex);
            console.log(err);
            callback({"status":err, "statusCode":0});
        }
    },
    authSwitch(userObj, connections, callback){
        try {
            if(userObj){
                switch(userObj.type){
                    case 'faceMatch':
                        _faceMatchUser(userObj, callback);
                        break;
                    case 'userLogin':
                        if(userObj.data){
                            _loginUser(userObj.data.userId, userObj.data.password, connections, callback)
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
        mongoClient.connect(database.remoteUrl, mongoOptions, function(err, client){
            const db = client.db(database.dbName).collection('users');
            db.find({ 'userId' : uname }).toArray(function(err, res){
                var ret = null;
                if(res) { ret = res[0]; }                
                callback(ret);
            });                       
        });
    }
    catch(ex){
        console.log("Error Getting User ", uname," :", ex);
        callback(null);
    }
}

/* Get User From DB */
function _getUserByFacename(facename, callback){
    try {
        mongoClient.connect(database.remoteUrl, mongoOptions, function(err, client){
            const db = client.db(database.dbName).collection('users');
            db.find({ 'facename' : facename }).toArray(function(err, res){
                var ret = null;
                if(res) { ret = res[0]; }                
                callback(ret);
            });                       
        });
    }
    catch(ex){
        console.log("Error Getting User By Facename ", facename," :", ex);
        callback(null);
    }
}

/* Add User to DB */
function _addUser(uname, pwd, name, callback){
    try {
        mongoClient.connect(database.remoteUrl, mongoOptions, function(err, client){
            const db = client.db(database.dbName).collection('users');
            db.insert({"userId":uname, "pwd":pwd, "name":name });     
            callback({"status":true});                 
        });
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
function _loginUser(user, password, connections, callback){
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