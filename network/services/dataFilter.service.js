'use strict';

var util = require('util');
var jEyes = require('../../jada_3/jeyes');

var dataFilter =  {
    filterCheck: function(info,callback){
        try {
            if(!(info.filter && info.filterStatus)){
                callback(info);
            }
            else {
                switch(info.filter){
                    case 'faceRecognition':
                        j_faceRecog(info.data, callback);
                        break;
                    default:
                        callback(info.data);
                        break;
                }
            }
        }
        catch(ex){

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

    callback((retData != null? jEyes.matTob64(retData) : null));
}
