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
                        break;
                    case 'objDetect':
                        var infoData = { filter:"base", searchFilters: null };
                        j_objDetect(info.data, infoData, callback);
                        break;
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
    var ret = {};
    try {
        var matImg = jEyes.b64toMat(img);  
        if(matImg != null){
            var retData = jEyes.faceRecogImg(matImg);
            ret = {
                "tags":(retData != null && retData.names ? retData.names : []),
                "data": (retData != null && retData.img != null ? jEyes.matTob64(retData.img) : null)
            };   
        }      
    }
    catch(ex){
        jbrain.jCells.jtools.errorLog(" [ERROR] FaceRecog Service:" + ex);
    }
    
    callback(ret);
}

function j_faceMark(img, callback){
    var ret = {};
    try {
        var matImg = jEyes.b64toMat(img);        
        var retData = (matImg != null ? jEyes.facemarkImg(matImg, true) : null);  

        ret = {"data": (retData != null && retData.img != null ? jEyes.matTob64(retData.img) : null)}; 
    }
    catch(ex){
        jbrain.jCells.jtools.errorLog(" [ERROR] Face Mark Service:" + ex);
    }
    
    callback(ret);
}

function j_edgeDetect(img, callback){
    var ret = {};

    try {
        var matImg = jEyes.b64toMat(img);        
        var retData = (matImg != null ? jEyes.edgeDetectionImg(matImg) : null); 
        
        ret = {"data": (retData != null && retData.img != null ? jEyes.matTob64(retData.img) : null)};
    }
    catch(ex){
        jbrain.jCells.jtools.errorLog(" [ERROR] Edge Detection Service:" + ex);
    }
        
    callback(ret);
}

function j_objDetect(img, data, callback){
    var ret = {};
    try {
        var matImg = jEyes.b64toMat(img); 
        var searchFilters = (data && data.searchFilters ? data.searchFilters : null);
        var filter = (data && data.filter ? data.filter : "base");

        if(matImg != null){
            var retData = jEyes.modelMapImg(matImg, searchFilters, filter); 
            ret = {
                "tags":(retData != null && retData.layers ? retData.layers : []), 
                "data": (retData != null && retData.img != null ? jEyes.matTob64(retData.img) : null)
            };
        }    
    }
    catch(ex){
        jbrain.jCells.jtools.errorLog(" [ERROR] Object Detection Service:" + ex);
    }
    
    callback(ret);
}
