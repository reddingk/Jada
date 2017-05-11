var fs = require('fs');
var cv = require('opencv');

cv.readImage("./phoebe_stuff/Rae1.jpg", function(err, im){
  im.detectObject(cv.FACE_CASCADE, {"scale":1.5, "neighbors":2}, function(err, faces){
    console.log("There Are " + faces.length + " Faces");

    for (var i=0;i<faces.length; i++){
      var x = faces[i]
      im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2, [255,0,0], 5);
      for (var i=0;i<faces.length; i++){
        var x = faces[i];
        im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2, [255,0,0], 5);

        im.detectObject(cv.EYE_CASCADE,{"scale":1.8, "neighbors":2}, function(err, eyes){
          console.log("Face: " + i +" There Are " + eyes.length + " Eyes");

          for(var j=0; j<eyes.length; j++){
            var y = eyes[j];
            //im.ellipse(x.x + y.x + y.width/2, x.y + y.y + y.height/2, y.width/2, y.height/2, [0,0,255], 5);
            im.ellipse(y.x + y.width/2, y.y + y.height/2, y.width/2, y.height/2, [0,0,255], 5);
          }
          im.save('./phoebe_stuff/out/out1.jpg');
        });
      }
    }
    //im.save('./phoebe_stuff/out1.jpg');
  });
});
