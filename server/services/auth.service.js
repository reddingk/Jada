'use strict';
require('dotenv').config();

const bcrypt = require('bcrypt');
const util = require('util');
const jwt = require('jsonwebtoken');
var mongoClient = require('mongodb').MongoClient;

var log = require('./log.service');

var database = {
    connectionString: process.env.DatabaseConnectionString,
    dbName: process.env.DatabaseName,
    mongoOptions:{ useUnifiedTopology: true }
}

var auth = { 
    paramCheck(params, obj) {
        var ret = true;
        try {
            if(!obj){
                ret = false;
            }
            else{
                for(var i = 0; i < params.length; i++){
                    if(!(params[i] in obj) || obj[params[i]] == null){
                        log.warning(params[i] + " is missing ");
                        ret = false;
                        break;
                    }
                }
            }
        }
        catch(ex){
            log.error("checking params"); ret = false;
        }
        return ret;
    },   
    authenticateUser: function(userInfo, callback){
        try {
            _getUserByUId(userInfo.userId, function(res){
                if(res.error){
                    callback(res);
                }
                else if(userInfo._id == res.results._id){
                    callback({ results: res.results.admin });                    
                }
                else { callback({ results: false }); }
            }); 
        }
        catch(ex){
            var err = util.format("Error Authenticating %s On: %s", userInfo.userId, ex);
            log.error(err);
            callback({ "error":err});
        }
    },
    authenticateJWTUser: function(token, callback){
        try {
            var decoded = jwt.verify(token, process.env.NARATIFLA_SECRET);
            if(!decoded) {
                callback({ status: false, error: "Invalid Token" });
            }
            else {
                _getUserByUId(decoded.userId, function(res){
                    if(res.error){
                        res.status = false; callback(res);
                    }
                    else {
                        callback({ status: (decoded._id == res.results._id), results: decoded });                    
                    }
                }); 
            }
        }
        catch(ex){
            var err = util.format("Error Authenticating JWT Token On: %s", ex);
            log.error(err); callback({ "error":err});
        }
    }
}

module.exports =  auth;

/* Get User From DB */
function _getUserByUId(uID, callback){
    var response = { "error":null, "results":false };
    try {
        if(uID) {
            mongoClient.connect(database.connectionString, database.mongoOptions, function(err, client){
                if(err) {
                    response.error = err;
                    if(client) { client.close(); }
                    log.error("Getting User By UID: " + err);
                    callback(response);
                }
                else {
                    const db = client.db(database.dbName).collection('users');
                    db.find({ userId: uID }).toArray(function(err, res){ 
                        if(err) { response.error = "[Error] Retrieving User: "+ err; }
                        else if(res.length == 0) { response.error = "No Users Found"; }
                        else {  response.results = res[0]; }
                        client.close();
                        callback(response);  
                    });                   
                }
            });
        }
        else {
            response.error = "No User ID To Look Up";
            callback(response);
        }
    }
    catch(ex){
        response.error = "Error Getting User " + uID +" :" + ex;
        log.error(response.error); callback(response);
    }
}