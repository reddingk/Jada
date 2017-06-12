var fs = require('fs');
var cv = require('opencv');
var path = require('path');

// Global Variables
var camWidth = 320, camHeight = 240, camInterval = 100, lineType = 8, maxLevel = 0, thickness = 3;

var videoDisplay = false;

// Stop Video
exports.stopStream = function stopVideo(){
    videoDisplay = false;
}

// Live stream video to socket
exports.liveStream = function liveStream(socket){
  try {
    // Set Video Display flag
    videoDisplay = true;
    var videoStatus = null;

    var vid = new cv.VideoCapture(0);
    vid.setWidth(camWidth);
    vid.setHeight(camHeight);
    
    console.log("Setting Up Camera");

    videoStatus = setInterval(function() {
      if(!videoDisplay){          
        console.log("[Live] Exited Camera");
        clearInterval(videoStatus);        
      }   
      else {
        vid.read(function(err, im) {
            if (err) throw err;

            if (im.size()[0] > 0 && im.size()[1] > 0){          
            socket.emit('PHframe', { buffer: im.toBuffer() });
            }        
        });
      }
    }, camInterval);
  }
  catch(ex){
    console.log("[Live] Couldn't start camera:" + ex);
  }
}

// Video Face Detection
exports.faceDetect =function faceDetect(socket){
  try {
    // Set Video Display flag
    videoDisplay = true;
    var videoStatus = null;

    var detectColor = [255,0,0];
    var camera = new cv.VideoCapture(0);
    camera.setWidth(camWidth);
    camera.setHeight(camHeight);
    
    console.log("Set Up Camera");

    videoStatus = setInterval(function() {
      if(!videoDisplay){          
        console.log("[Face Detect] Exited Camera");
        clearInterval(videoStatus);        
      }   
      else {
        camera.read(function(err, im) {
            if (err) throw err;

            if (im.size()[0] > 0 && im.size()[1] > 0){

            im.detectObject(cv.FACE_CASCADE, {}, function(err, faces){
                if(err) throw err;

                for (var i=0;i<faces.length; i++){
                var face = faces[i];
                im.ellipse(face.x + face.width/2, face.y + face.height/2, face.width/2, face.height/2, detectColor, 2);
                }
                socket.emit('PHframe', { buffer: im.toBuffer() });
            });
            }
        });
      }
    }, camInterval);
  }
  catch(ex){
    console.log("[Face Detect] Couldn't start camera:" + ex);
  }
}

// Video Motion Tracker
exports.motionTracker =function motionTracker(socket){
    try {
        // Set Video Display flag
        videoDisplay = true;
        var videoStatus = null;
    
        var vid = new cv.VideoCapture(0);

        var frames = [null, null, null];
        var moveFrame = false;    

        var COLOR1 = [0, 255, 0]; // B, G, R    
        var COLOR2 = [0, 0, 255]; // B, G, R        
        var maxArea = 2500;

        var minThresh = 35;
        var maxThresh = 255;

        var blurSize1 = 55;
        var blurSize2 = 185;

        videoStatus = setInterval(function() {
            if(!videoDisplay){          
                console.log("[Motion] Exited Camera");
                clearInterval(videoStatus);        
            }   
            else {
                vid.read(function(err, mat){
                    if (err) throw err;
                
                    if(mat.size()[0] > 0 && mat.size()[1] > 0){               
                        
                        if(frames[0] == null || frames[1] == null ||frames[2] == null ){
                            for(var i =0; i < frames.length; i++){
                                if(frames[i] == null){
                                    frames[i] = mat.clone();
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
                            else { moveFrame = true; }                   
                            
                            var result = frames[0].clone();
                            // Take images and convert them to gray

                            for(var j =0; j < frames.length; j++){                         
                                if(frames[j].channels() >= 3) { 
                                    frames[j].convertGrayscale(); 
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
                            var contours = convertedMotion.findContours();

                            for (var i = 0; i < contours.size(); i++) {
                                if(contours.area(i) > maxArea) {
                                    var moments = contours.moments(i);
                                    var cgx = Math.round(moments.m10 / moments.m00);
                                    var cgy = Math.round(moments.m01 / moments.m00);
                                    
                                    result.drawContour(contours, i, COLOR1, thickness, lineType, maxLevel, [0, 0]);
                                    result.line([cgx - 5, cgy], [cgx + 5, cgy], COLOR2);
                                    result.line([cgx, cgy - 5], [cgx, cgy + 5], COLOR2);
                                }
                            }                                                                              
                            socket.emit('PHframe', { buffer: result.toBuffer() });                 
                        }               
                    }
                });
            }
        }, camInterval);
    }
    catch(ex){
        console.log("[Motion] Couldn't start camera:" + ex);
    }
}

// Color Detection
exports.multiColorTrack =function multiColorTrack(socket, minColorThresh, maxColorThresh){
   try{
      // Set Video Display flag
      videoDisplay = true;
      var videoStatus = null;
    
      var camera = new cv.VideoCapture(0);      

      //var color_thresh = [minColorThresh, [255, 149, 95]];         

      videoStatus = setInterval(function() {
        if(!videoDisplay){          
            console.log("[Multi Color] Exited Camera");
            clearInterval(videoStatus);        
        }   
        else {
            camera.read(function(err, im) {
                if (err) throw err;

                if (im.size()[0] > 0 && im.size()[1] > 0){
                    var thresh = im.copy();
                        
                    thresh.cvtColor('CV_BGR2HSV');            
                    thresh.inRange(minColorThresh, maxColorThresh);			      
                    // Erode
                    var erodeElement = cv.imgproc.getStructuringElement(1, [3, 3]);
                    thresh.erode(1, erodeElement);
                    thresh.erode(1, erodeElement);                    

                    //Dilate
                    var dilateElement = cv.imgproc.getStructuringElement(1, [8, 8]);
                    thresh.dilate(8);
                    thresh.dilate(8);
                            
                    var contours = thresh.findContours();

                    for (var i = 0; i < contours.size(); i++) {
                        if(contours.area(i) > 400) {
                            var moments = contours.moments(i);
                            var cgx = Math.round(moments.m10 / moments.m00);
                            var cgy = Math.round(moments.m01 / moments.m00);
                            
                            var color = [255,0,0];

                            im.drawContour(contours, i, color, thickness, lineType, maxLevel, [0, 0]);                
                        }
                    }
                    socket.emit('PHframe', { buffer: im.toBuffer() });
                }          
            });
        }
      }, camInterval);

    }
    catch(ex){
      console.log("[Multi Color] Couldn't start camera: " + ex);
    }  
}