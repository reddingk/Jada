var fs = require('fs');
var cv = require('opencv');
var path = require('path');

// server info
var os = require('os');
var mongoose = require('mongoose');
var database = require('./dbcfg');

// camera properties
var camWidth = 320;
var camHeight = 240;
var camInterval = 100;

mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrl);

var phoebeConnects = mongoose.model('connects', { name: {type: String, default: ''},  loc: {type: String, default: undefined} });

module.exports = function(io){
  phoebeConnects.find(function(err, tmpLoc){
    srcLoc = tmpLoc[0].loc;
    var id = "CB-" + os.hostname();

    //var socket = io.connect(srcLoc, { query: "userid="+id });
    //socket.emit('phoebes house', {"info":{"id":id} } );

    // TESTING FUNCTION
    motionTest2();   
  });
}

// Motion 2
function motionTest2(){
    var vid = new cv.VideoCapture(0);
    var window = new cv.NamedWindow('Video', 0);
    // Extra videos
    //var window1 = new cv.NamedWindow('Video 1', 0);
    //var window2 = new cv.NamedWindow('Video 2', 0);

    var frames = [null, null, null];
    var moveFrame = false;    

    var GREEN = [0, 255, 0]; // B, G, R    
    var RED   = [0, 0, 255]; // B, G, R
    var lineType = 8;
    var maxLevel = 0;
    var thickness = 1;
    var maxArea = 2500;

    var minThresh = 35;
    var maxThresh = 255;

    var blurSize1 = 55;
    var blurSize2 = 155;

    setInterval(function() {
        vid.read(function(err, mat){
            if (err) throw err;
        
            if(mat.size()[0] > 0 && mat.size()[1] > 0){               
                
                if(frames[0] == null || frames[1] == null ||frames[2] == null ){
                    for(var i =0; i < frames.length; i++){
                        if(frames[i] == null){
                            frames[i] = mat.clone();
                            console.log("Set Frame: " + i);
                            break;
                        }
                    }
                }

                // Motion Tracking
                if(!(frames[0] == null || frames[1] == null ||frames[2] == null)){                   
                    // Shift Frames
                    if(moveFrame){
                        frames[2] = frames[1].clone();                        
                        frames[1] = frames[0].clone();
                        frames[0] = mat.clone();
                    }
                    else { moveFrame = true; console.log("Move Frame: FALSE");}                   
                    
                    var result = frames[0].clone();
                    // Take images and convert them to gray

                    for(var j =0; j < frames.length; j++){                         
                        if(frames[j].channels() >= 3) { 
                            frames[j].convertGrayscale();
                            //frames[j].cvtColor('CV_BGR2GRAY'); 
                            frames[j].gaussianBlur([blurSize1,blurSize1]);                                                        
                        }
                    }

                    
                    // Calculate Differences Between the images and do AND-operation                   
                    var d1 = new cv.Matrix(frames[2].width(), frames[2].height());
                    d1.absDiff(frames[2], frames[0]);

                    var d2 = new cv.Matrix(frames[0].width(), frames[0].height());
                    d2.absDiff(frames[0], frames[1]);

                    var motion = new cv.Matrix(frames[0].width(), frames[0].height());
                    motion.bitwiseAnd(d1, d2);
                    
                    // Threshold
                    motion.threshold(minThresh, maxThresh, "Binary");                    
                    
                    // Erode
                    var kernelStructure = cv.imgproc.getStructuringElement(1, [2, 2]);
                    motion.erode(1, kernelStructure);

                    //Dilate
                    motion.dilate(2);

                    // Blur
                    motion.gaussianBlur([blurSize2,blurSize2]);                    

                    // Convert to CV 8U for findContours
                    var convertedMotion = new cv.Matrix(frames[0].width(), frames[0].height());
                    motion.convertTo(convertedMotion, cv.Constants.CV_8U);

                    // Find Contours
                    //var contours = convertedMotion.findContours(cv.Constants.RETR_EXTERNAL);
                    var contours = convertedMotion.findContours();

                    for (var i = 0; i < contours.size(); i++) {
                        if(contours.area(i) > maxArea) {
                            var moments = contours.moments(i);
                            var cgx = Math.round(moments.m10 / moments.m00);
                            var cgy = Math.round(moments.m01 / moments.m00);
                            
                            result.drawContour(contours, i, GREEN, thickness, lineType, maxLevel, [0, 0]);
                            result.line([cgx - 5, cgy], [cgx + 5, cgy], RED);
                            result.line([cgx, cgy - 5], [cgx, cgy + 5], RED);
                        }
                    }                   
                                     
                    window.show(result);
                    //window1.show(motion);
                    //window2.show(convertedMotion);
                }               
            }
            window.blockingWaitKey(0, 50);
        });
    }, camInterval);
}