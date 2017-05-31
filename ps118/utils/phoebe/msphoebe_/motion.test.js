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

    var socket = io.connect(srcLoc, { query: "userid="+id });
    socket.emit('phoebes house', {"info":{"id":id} } );

    // TESTING FUNCTION
    motionTest();
    //motionTest(socket);
  });
}

function motionTest(){
    var vid = new cv.VideoCapture(0);
    var window = new cv.NamedWindow('Video', 0);
    var frames = [null, null, null];
    var moveFrame = false;
    var x_start = 10, x_stop = 100;
    var y_start = 350, y_stop = 530;
    var max_deviation = 20;
    var color = [0,255,255];

    setInterval(function() {
        vid.read(function(err, mat){
            if (err) throw err;

            if(mat.size()[0] > 0 && mat.size()[1] > 0){
                if(frames[0] == null || frames[1] == null ||frames[2] == null ){
                    for(var i =0; i < 3; i++){
                        if(frames[i] == null){
                            frames[i] = mat.clone();
                            console.log("Set Frame: " + i);
                            break;
                        }
                    }
                }

                // Motion Tracking
                if(!(frames[0] == null || frames[1] == null ||frames[2] == null )){                   
                    // Shift Frames
                    if(moveFrame){
                        frames[2] = frames[1].clone();
                        frames[1] = frames[0].clone();
                        frames[0] = mat.clone();
                    }
                    else { moveFrame = true; console.log("Move Frame: FALSE");}                    

                    console.log("Clone Frame");
                    var result = frames[0].clone();
                    // Take images and convert them to gray
                    //for(var j =0; j < 3; j++){ frames[j].cvtColor('CV_BGR2GRAY'); }

                    /*
                    // Calculate Differences Between the images and do AND-operation
                    var d1 = new cv.Matrix(frames[2].width(), frames[2].height());
                    d1.absDiff(frames[2], frames[0]);

                    var d2 = new cv.Matrix(frames[0].width(), frames[0].height());
                    d2.absDiff(frames[0], frames[1]);

                    var motion = new cv.Matrix(frames[0].width(), frames[0].height());
                    motion.bitwiseAnd(d1, d2);

                    // Threshold
                    motion.threshold(35, 255, "Binary");

                    // Erode
                    var kernelStructure = cv.imgproc.getStructuringElement(1, [2, 2]);
                    motion.erode(1, kernelStructure);

                    // Detect Motion
                    var number_of_changes = detectMotion(motion, result, null, x_start, x_stop, y_start, y_stop, max_deviation, color);
                    */
                    window.show(result);
                }
                
            }
        });
    }, camInterval);
}

function detectMotion(motion, result, result_cropped, x_start, x_stop, y_start, y_stop, max_deviation, color){
    var stddev = null;
    motion.meanStdDev();
    if(motion[0] < max_deviation){
        console.log("MOVED");
    }
    return 1;
}