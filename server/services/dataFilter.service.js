'use strict';
const log = require('../services/log.service');

const Brain = require('../../jada_3/jbrain.js');
const Eyes = require('../../jada_3/jeyes');

/* Class Decleration */
const jbrain = new Brain();
const jEyes = new Eyes();

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
            log.error("filter check: " + ex);
        }
    },
    jadaConvo: function(info, userId, callback){
        try {
            jbrain.convo(info.input, userId, function(res){ callback(res); });
        }
        catch(ex){
            log.error("with jada convo: "+ ex);
            callback({"error": "[Error] with jada convo: "+ ex});
        }
    },
    jadaDirectData: function(func, items, token, callback){
        try {  
            jbrain.directData(token, func, items, function(res){ callback(res); });
        }
        catch(ex){
            log.error("with jada direct data: "+ ex);
            callback({"error": "[Error] with jada direct data: "+ ex});
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
        log.error("FaceRecog Service:" + ex);
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
        log.error("Face Mark Service:" + ex);
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
        log.error("Edge Detection Service:" + ex);
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
        log.error("Object Detection Service:" + ex);
    }
    
    callback(ret);
}
