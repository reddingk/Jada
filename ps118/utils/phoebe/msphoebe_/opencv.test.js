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
var camFps = 10;
var camInterval = 1000 / camFps;

mongoose.Promise = global.Promise;
mongoose.connect(database.remoteUrl);

var cocoConnects = mongoose.model('connects', { name: {type: String, default: ''},  loc: {type: String, default: undefined} });

module.exports = function(io){
  cocoConnects.find(function(err, tmpLoc){
    srcLoc = tmpLoc[0].loc;
    var id = "CB-" + os.hostname();

    var socket = io.connect(srcLoc, { query: "userid="+id });

    // TESTING FUNCTION
    //imageTest();
    //videoFrameTest();
    //cameraTest();
    faceCheckTest(socket);
  });
}


function imageTest(){
  var testImgs = ["./phoebe_stuff/Rae1.jpg","./phoebe_stuff/UD4.jpg","./phoebe_stuff/Group1.jpg","./phoebe_stuff/nasa1.jpg"];
  var testID = 0;

  cv.readImage(testImgs[testID], function(err, im){
    im.detectObject(cv.FACE_CASCADE, {/*"scale":1.3, "neighbors":4*/}, function(err, faces){
      if(err) throw err;

      console.log("There Are " + faces.length + " Faces");

      for (var i=0;i<faces.length; i++){
        var face = faces[i]
        im.ellipse(face.x + face.width/2, face.y + face.height/2, face.width/2, face.height/2, [255,0,0], 2);

        /*im.detectObject(cv.EYE_CASCADE,{"scale":1.3, "neighbors":4}, function(err, eyes){
          console.log("Face: " + i +" There Are " + eyes.length + " Eyes");

          for(var j=0; j<eyes.length; j++){
            var y = eyes[j];
            im.ellipse(y.x + y.width/2, y.y + y.height/2, y.width/2, y.height/2, [0,0,255], 5);
          }
          im.save('./phoebe_stuff/out/out'+testID+'.jpg');
        });*/
      }
      im.save('./phoebe_stuff/out/out'+testID+'.jpg');
      console.log("Finished Proccessing");
    });
  });
}

function videoFrameTest(){
  // When opening a file, the full path must be passed to opencv
  console.log(__dirname);
  var tstFile = "C:\\Users\\kredding\\Documents\\KR\\Random\\Dev\\Jada\\ps118\\utils\\phoebe";
  var vidFile = path.join(tstFile, 'phoebe_stuff', 'motion.mov');
  console.log("[]"+vidFile);

  var vid = new cv.VideoCapture(vidFile);

  vid.read(function(err, mat){
    if (err) throw err;

    var track = new cv.TrackedObject(mat, [420, 110, 490, 170], {channel: 'value'});
    var x = 0;
    var iter = function(){
      vid.read(function(err, m2){
        x++;
        var rec = track.track(m2)
        console.log('>>', x, ':' , rec)
        if (x % 10 == 0){
          m2.rectangle([rec[0], rec[1]], [rec[2], rec[3]])
          m2.save('./phoebe_stuff/outFrames/out-motiontrack-' + x + '.jpg')
        }
        if (x<100)
          iter();
      })
    }
    iter();
  });
}

function cameraTest(){
  try {
    var camera = new cv.VideoCapture(0);
    var window = new cv.NamedWindow('Video', 0)

    setInterval(function() {
      camera.read(function(err, im) {
        if (err) throw err;
        //console.log(im.size())
        if (im.size()[0] > 0 && im.size()[1] > 0){
          window.show(im);
        }
        window.blockingWaitKey(0, 50);
      });
    }, 20);
  } catch (e){
    console.log("Couldn't start camera:" + e);
  }
}

function faceCheckTest(socket){
  try {
    var camera = new cv.VideoCapture(0);
    camera.setWidth(camWidth);
    camera.setHeight(camHeight);

    var window = new cv.NamedWindow('Video', 0)

    console.log("Set Up Camera");

    setInterval(function() {
      camera.read(function(err, im) {
        if (err) throw err;

        if (im.size()[0] > 0 && im.size()[1] > 0){
          console.log("Send Data");
          window.show(im);
          socket.emit('frame', { buffer: im.toBuffer() });
        }
        window.blockingWaitKey(0, 50);
      });
    }, camInterval);
  }
  catch(ex){
    console.log("Couldn't start camera:" + ex);
  }
}
