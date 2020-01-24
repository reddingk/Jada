'use strict';
/*
 * JADA TOOLS LIBRARY CLASS
 * By: Kris Redding
 */

var crypto = require('crypto');
var underscore = require('underscore');

require('dotenv').config();
const settingLoc = process.env.CONFIG_LOC + "/settingsdb.json";
const settingdb = require(settingLoc);
const locationdb = require(process.env.CONFIG_LOC + "/locationdb.json");
const db = require(process.env.CONFIG_LOC + "/db.json");


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

    getUserData(userId) {
        var userData = null;

        try {
            var retUser = underscore.where(db.users, {userId: userId});          
            var retSettings = underscore.where(settingdb, {userId: userId});

            if(retUser && retSettings){                
                var mykey = crypto.createDecipher(process.env.CIPER_ALG, retUser[0].pwd);
                var mystr = mykey.update(retSettings[0], 'hex', 'utf8')
                mystr += mykey.final('utf8');

                userData = JSON.parse(mystr);
            }
        }
        catch(ex){
            console.log("Error Getting User Data: ",ex);
        }
        return userData;
    }

    updateUserData(userId, userData) {       
        var ret = false;
        try {
            var retUser = underscore.where(db.users, {userId: userId});
            var retSettings = underscore.where(settingdb, {userId: userId});

            if(retUser && retSettings){ 
                var strData = JSON.stringify(userData);             
                var mykey = crypto.createCipher(process.env.CIPER_ALG, retUser[0].pwd);
                var mystr = mykey.update(strData, 'hex', 'utf8')
                mystr += mykey.final('utf8');

                settingdb[userId] = mystr;
                fs.writeFileSync(settingLoc, JSON.stringify(settingdb), {"encoding":'utf8'});

                ret = true;
            }
        }
        catch(ex){
            ret = false;
            console.log("Error Getting User Data: ",ex);
        }
        return ret;
    }
}

module.exports = TOOLS;