require('dotenv').config();
const fs = require('fs');

var logservice = {
    error: function(message){
        try {
            updateLog(" [Error] " + message);
        }
        catch(ex){
            console.log("[ER] Logging: ",ex);
        }
    },
    warning: function(message){
        try {
            updateLog(" [Warning] " + message);
        }
        catch(ex){
            console.log("[ER] Logging(2): ",ex);
        }
    },
    info: function(message){
        try {
            updateLog("> " + message);
        }
        catch(ex){
            console.log("[ER] Logging(3): ",ex);
        }
    },
    debug: function(message){
        try {
            updateLog(" [DEBUG] ");
            updateLog(message);            
        }
        catch(ex){
            console.log("[ER] Logging(4): ",ex);
        }
    }
}

module.exports = logservice;

// Update LogFile
function updateLog(msg){
    try {

        var dir = process.env.LOG_LOC + "/logs";
        var d = new Date();

        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        if(!fs.existsSync(dir + "/log.txt")){
            fs.appendFileSync(dir + "/log.txt", "-- --\n");
        }

        if(fs.statSync(dir + "/log.txt").size >= process.env.MAX_LOG_SZ){
            // Change File Name to old date name
            fs.renameSync(dir + "/log.txt", dir + "/log_"+ d.getTime() +".txt");
            // Create new log file
            fs.appendFileSync(dir + "/log.txt", "-- --\n");

            var dirList = fs.readdirSync(dir);

            if(dirList.length >= process.env.MAX_LOG_CNT) {
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
        msg = ' '+ d.toString() + ' | ' + msg;
        fs.appendFileSync(dir + "/log.txt", msg + '\n'); 
    }
    catch(ex){
        console.log(" [Error] writing to log: ",ex);
    }    
}