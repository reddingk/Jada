'use strict';
/*
 * JADA TOOLS LIBRARY CLASS
 * By: Kris Redding
 */

const Cryptr = require('cryptr');
const underscore = require('underscore');
const fs = require('fs');
const Buffer = require('buffer').Buffer;

require('dotenv').config();
const dbLoc = {
    "settingdb": {path: process.env.CONFIG_LOC + "/settingsdb.json", encode: 'utf8'},
    "locationdb": {path: process.env.CONFIG_LOC + "/locationdb.json", encode: 'utf8'},
    "db":{path: process.env.CONFIG_LOC + "/db.json", encode: 'utf8'}
};


class TOOLS {  
    constructor() {}
    
    stringFormat(str, args) {
        var content = str;
        for (var i=0; i < args.length; i++){
            var replacement = '{' + i + '}';
            content = content.replace(replacement, args[i]);
        }
        return content;
    }

    emptyCheck(val) {
        return(val == undefined || val == '' || val == null);
    }

    checkConfig(list, config){
        for(var i=0; i < list.length; i++){
            if(!(list[i] in config)){
                return false;
            }
        }
        return true;
    }
    
    errorLog(msg){
        try {
            var dir = process.env.CONFIG_LOC + "/logs";
            var d = new Date();
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
    
            if(!fs.existsSync(dir + "/log.txt")){
                fs.appendFileSync(dir + "/log.txt", "-- --\n");
            }
            
            // Check file size 
            if(fs.statSync(dir + "/log.txt").size >= process.env.MAX_FILE_SZ){
                var d = new Date();
                // Change File Name to old date name
                fs.renameSync(dir + "/log.txt", dir + "/log_"+ d.getTime() +".txt");
                // Create new log file
                fs.appendFileSync(dir + "/log.txt", "-- --\n");
    
                var dirList = fs.readdirSync(dir);
    
                if(dirList.length >= process.env.MAX_FILE_CNT) {
                    var fileList = [];
                    dirList.forEach(function (file) {
                        if(fs.existsSync(dir + "/" + file)){
                            var tmpStats = fs.statSync(dir + "/"+file);
                            tmpStats.path = dir + "/" + file;
                            fileList.push(tmpStats);
                        }
                        else {
                            if(process.env.DEBUG) { console.log("File DNE: ", file); }
                        }
                    });
    
                    const minFile = fileList.reduce(function(prev, current) {
                        return (prev.mtimeMs < current.mtimeMs) ? prev : current
                    });
    
                    // Delete Oldest File       
                    if(process.env.DEBUG) { console.log(" Delete File: ", minFile.path); }           
                    fs.unlinkSync(minFile.path);                    
                }
            }       
            
            if(process.env.DEBUG) { console.log(msg); }
            msg = ' '+ d.toUTCString() + ' | ' + msg;
            fs.appendFileSync(dir + "/log.txt", msg + '\n');            
        }
        catch(ex){
            console.log(" [ERROR] Writing to Error Log: ", ex);
        }
    }

    getDBData(type){
        var ret = {};

        try {
            var getLoc = dbLoc[type];

            if(getLoc){
                ret = JSON.parse(fs.readFileSync(getLoc.path), {encoding: getLoc.encode});
            }
        }
        catch(ex){
            this.errorLog(" [ERROR] Getting DB Data: " + ex);
        }

        return ret;
    }

    setDBData(type, setData){
        var ret = false;
        try {
            var getLoc = dbLoc[type];

            if(getLoc){
                fs.writeFileSync(getLoc.path, JSON.stringify(setData), {encoding: getLoc.encode});
                ret = true;
            }            
        }
        catch(ex){
            this.errorLog(" [ERROR] Setting DB Data: " + ex);
        }
        return ret;
    }

    getUserData(userId) {
        var userData = {name:'',voice:'off',lastAction:{},locations:{},relationships:{}};

        try {
            var db = this.getDBData("db");
            var settingdb = this.getDBData("settingdb");

            var retUser = underscore.where(db.users, {userId: userId});          
            var retSettings = settingdb[userId];

            if(retUser && retSettings){      
                var settingKey = _updateKeyLength(retUser[0][process.env.CIPHER_KEY_ATTR], process.env.CIPER_KEY_LENGTH);                                
                var cryptr = new Cryptr(settingKey);

                var tmpData = cryptr.decrypt(retSettings);
                userData = JSON.parse(tmpData);
            }
        }
        catch(ex){
            this.errorLog(" [ERROR] Getting User Data: " + ex);
        }
        return userData;
    }

    updateUserData(userId, userData) {       
        var ret = false;
        try {
            var db = this.getDBData("db");
            var settingdb = this.getDBData("settingdb");

            var retUser = underscore.where(db.users, {userId: userId});

            if(retUser){ 
                var settingKey = _updateKeyLength(retUser[0][process.env.CIPHER_KEY_ATTR], process.env.CIPER_KEY_LENGTH);                                
                var cryptr = new Cryptr(settingKey);
                var strData = JSON.stringify(userData);

                settingdb[userId] = cryptr.encrypt(strData);                
                ret = this.setDBData("settingdb", settingdb);
            }
        }
        catch(ex){
            ret = false;
            this.errorLog(" [ERROR] Updating User Data: " + ex);
        }
        return ret;
    }
}

module.exports = TOOLS;

function _updateKeyLength(key, length){
    try {
        var cipherLength = parseInt(length);
        var tmpkey = key.toString();

        if(tmpkey.length < cipherLength){
            for(var i = tmpkey.length; i < cipherLength; i++){
                tmpkey = process.env.CIPHER_KEY_WILDCARD+ tmpkey;
            }
        }
        else if(tmpkey.length > cipherLength) {
            tmpkey = tmpkey.subString(0,cipherLength);
        }
    }
    catch(ex){
        console.log(" [ERROR] updating key length: ",ex);
    }
    return tmpkey;
}