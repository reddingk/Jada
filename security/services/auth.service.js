'use strict';

const util = require('util');
const bcrypt = require('bcrypt');
const UIDGenerator = require('uid-generator');
var database = require('../../jada_3/config/database');
var mongoClient = require('mongodb').MongoClient;

const uidgen = new UIDGenerator(); 
const saltRounds = 15;

var auth = {
    createUser: function(user, password, name, connections, callback){
        var self = this;
        try {
            self.getUserByUname(user, function(res){
                if(res){
                    callback({"error":"User Already Exists"});
                }
                else {
                    var pwdHash = bcrypt.hashSync(password, saltRounds);
                    self.addUser(user, pwdHash, name, callback);
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
            self.getUserByUname(user, function(res){
                if(!res){
                    callback({"error":"Invalid User"});
                }
                else {
                    bcrypt.compare(password, res.pwd, function(err, res){
                        if(res){
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
            /*self.getUserByUname(user, function(res){
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
    }
}

module.exports =  auth;

/* Get User From DB */
function getUserByUname(uname, callback){
    try {
        mongoClient.connect(database.remoteUrl, self.mongoOptions, function(err, client){
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

/* Add User to DB */
function addUser(uname, pwd, name, callback){
    try {
        mongoClient.connect(database.remoteUrl, self.mongoOptions, function(err, client){
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