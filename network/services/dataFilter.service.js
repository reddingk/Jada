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
            jbrain.jCells.jtools.errorLog(" [ERROR] filter check: " + ex);
        }
    },
    jadaConvo: function(info, userId, callback){
        try {
            var trimInput = jbrain.jlanguage.cleanPhrase(info.input.trim());  
            jbrain.convo(trimInput, userId, function(res){
                callback(res);
            });
        }
        catch(ex){
            var errorMsg = " [ERROR] with jada convo: "+ ex;
            jbrain.jCells.jtools.errorLog(errorMsg);
            callback({"error": errorMsg});
        }
    },
    jadaDirectData: function(func, items, callback){
        try {  
            jbrain.directData(func, items, function(res){
                callback(res);
            });
        }
        catch(ex){
            var errorMsg = " [ERROR] with jada direct data: "+ ex;
            jbrain.jCells.jtools.errorLog(errorMsg);
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
        jbrain.jCells.jtools.errorLog(" [ERROR] FaceRecog Service:" + ex);
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
        jbrain.jCells.jtools.errorLog(" [ERROR] Face Mark Service:" + ex);
        retData = null;
    }
    
    callback((retData != null? jEyes.matTob64(retData.img) : null));
}

function j_edgeDetect(img, callback){
    var retData = null;
    try {
        var matImg = jEyes.b64toMat(img);        
        retData = (matImg != null ? jEyes.edgeDetectionImg(matImg) : null); 
        
        //jbrain.jCells.jtools.errorLog(" [DEBUG]:" + (retData ? "Valid" : "Is Null"));
    }
    catch(ex){
        jbrain.jCells.jtools.errorLog(" [ERROR] Edge Detection Service:" + ex);
        retData = null;
    }
    
    callback((retData != null? jEyes.matTob64(retData.img) : null));
}
