'use strict';

var util = require('util');
const Brain = require('../../jada_3/jbrain.js');

/* Class Decleration */
const jbrain = new Brain();
const jEyes = jbrain.jCells.jeyes;

var dataFilter =  {
    filterCheck: function(info,callback){
        try {
            
            if(!(info.filter && info.filterStatus)){
                callback(info.data);
            }
            else {
                switch(info.filter){
                    case 'faceRecognition':
                        j_faceRecog(info.data, callback);
                        break;
                    case 'faceMark':
                        j_faceMark(info.data, callback);
                        break;
                    case 'edgeDetect':
                        j_edgeDetect(info.data, callback);
                    default:
                        callback(info.data);
                        break;
                }
            }
        }
        catch(ex){
            console.log(" Error filter check: ", ex);
        }
    },
    jadaConvo: function(info, callback){
        try {
            var trimInput = jbrain.jlanguage.cleanPhrase(info.input.trim());  
            jbrain.convo(trimInput, function(res){
                callback(res);
                //process.exit(0);
            });
        }
        catch(ex){
            var errorMsg = " Error with jada convo: "+ ex;
            console.log(errorMsg);
            callback({"error": errorMsg});
        }
    }
}

module.exports = dataFilter;

/* Private Functions */
function j_faceRecog(img, callback){
    var retData = null;
    try {
        var matImg = jEyes.b64toMat(img);        
        retData = (matImg != null ? jEyes.faceRecogImg(matImg) : null);      
    }
    catch(ex){
        console.log("Error FaceRecog Service:", ex);
        retData = null;
    }
    
    callback((retData != null? jEyes.matTob64(retData.img) : null));
}

function j_faceMark(img, callback){
    var retData = null;
    try {
        var matImg = jEyes.b64toMat(img);        
        retData = (matImg != null ? jEyes.facemarkImg(matImg, true) : null);      
    }
    catch(ex){
        console.log("Error Face Mark Service:", ex);
        retData = null;
    }
    
    callback((retData != null? jEyes.matTob64(retData.img) : null));
}

function j_edgeDetect(img, callback){
    var retData = null;
    try {
        var matImg = jEyes.b64toMat(img);        
        retData = (matImg != null ? jEyes.edgeDetectionImg(matImg) : null); 
        
        //console.log(" [DEBUG]:", (retData ? "Valid" : "Is Null"));
    }
    catch(ex){
        console.log("Error Edge Detection Service:", ex);
        retData = null;
    }
    
    callback((retData != null? jEyes.matTob64(retData.img) : null));
}
