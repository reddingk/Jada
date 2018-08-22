'use strict';
/*
 * JADA EYES CLASS
 * By: Kris Redding
 */

const cv = require("opencv4nodejs");
const fs = require("fs");
const path = require("path");
const screen = require("screen-info");

class JEYES {
    constructor(){
        this.facialClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
        this.facemarkModel = __dirname+"/config/data/lbfmodel.yaml";
        this.photoMemory = __dirname + "/config/data/photoMemory";
        this.PhoebeColor = new cv.Vec(4,205,252);
        this.imgResize = 80;
        this.nameMappings = ['grace', 'kris', 'jason', 'daphne', 'kaila', 
                            'dominique', 'nina', 'naomi', 'nicole', 'asia', 
                            'ashley', 'marquis', 'vince','khalin'];
    }

    
    /* Motion Tracking */
    motionTrackingCamera(callback){
        var self = this;

        try{
            let done = false;
            var delay = 50;

            const bgSubtractor = new cv.BackgroundSubtractorMOG2();
            var camera = new cv.VideoCapture(0);
            
            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                // Track motion
                const foreGroundMask = bgSubtractor.apply(frame);
                const iterations = 2;
                const dilated = foreGroundMask.dilate(
                    cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
                    new cv.Point(-1, -1),
                    iterations
                );
                const blurred = dilated.blur(new cv.Size(10, 10));
                const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);

                const minPxSize = 4000;
                var movingTargets = self._drawRectAroundBlobs(thresholded, frame, minPxSize);
                
                // Draw number of moving targets
                frame.drawRectangle(
                    new cv.Point(10, 10), new cv.Point(70, 70),
                    { color: self.PhoebeColor, thickness: 2 }
                );
                frame.putText(
                    String(movingTargets),
                    new cv.Point(20, 60), cv.FONT_ITALIC, 2,
                    { color: self.PhoebeColor, thickness: 2 }
                );

                // Stream Or View Locally
                cv.imshow("Motion Camera Frame", frame);
                
                const key = cv.waitKey(delay);
                done = key !== -1 && key !== 255;
                if (done) {
                    clearInterval(intvl);
                    callback(-100);
                }
            }, 0);
        }
        catch(ex){
            console.log(" Debug: Error with motion tracking camera: ", ex);
        }
    }

    /* Facial Recognition from image file */
    facialRecognitionFile(file){
        var self = this;
        const minDetections = 120;

        var result = null;
        try {
            if (!fs.existsSync(file)){
                throw new Error("could not find file: " + file);
            }
            var recogData = self._loadRecogTrainingData();  

            const recogImg = self._sizeImg(cv.imread(file));
            result = self.faceRecogImg(recogImg, recogData, minDetections);

            cv.imshowWait('result', result.img);
        }
        catch(ex){
            console.log(" Debug Error With Facial Recognition: ", ex);
        }

        return result.names;
    }

    /* Detect number of faces from image file */
    facemarkFile(file){
        var self = this;
        try {
            if (!fs.existsSync(file)){
                throw new Error("could not find file: " + file);
            }
            // retrieve faces using the facemark face detector callback
            const img = cv.imread(file);
            // Facemark Image
            var retImg = self.facemarkImg(img, true, self.loadFacemark());

            if(retImg.img != null){
                cv.imshowWait("Image Frame", retImg.img);
            }

            return retImg.total;
        }
        catch(ex){
            console.log("Demo Error: ", ex);
            return -1;
        }
    }

    /* Live Camera */
    liveCamera(callback){
        var self = this;
        
        try{
            let done = false;
            var camera = new cv.VideoCapture(0);

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }

                // Stream Or View Locally
                cv.imshow("Live Camera Frame", frame);
                const key = cv.waitKey(1);

                done = key !== -1 && key !== 255;
                if (done) {
                    clearInterval(intvl);
                    callback(-100);
                }
            }, 0);
        }
        catch(ex){
            console.log(" Debug: Error with live camera: ", ex);
        }
    }

    /* Facemark Camera */
    facemarkCamera(callback){
        var self = this;
        
        try{
            let done = false;
            var camera = new cv.VideoCapture(0);
            const facemark = self.loadFacemark();

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                
                // Facemark Image
                var retImg = self.facemarkImg(frame, true, facemark);

                // Stream Or View Locally
                cv.imshow("Facemark Frame", retImg.img);
                const key = cv.waitKey(1);

                done = key !== -1 && key !== 255;
                if (done) {
                    clearInterval(intvl);
                    callback(-100);
                }
            }, 0);
        }
        catch(ex){
            console.log(" Debug: Error with live camera: ", ex);
        }
    }

    /* Facemark Camera */
    faceRecognizeCamera(callback){
        var self = this;
        var minDetections = 120;

        try{
            let done = false;
            var recogData = self._loadRecogTrainingData(); 
            var camera = new cv.VideoCapture(0);

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                
                // Face Recognize Image
                var retImg = self.faceRecogImg(frame, recogData, minDetections);

                // Stream Or View Locally
                cv.imshow("Facial Recognition Frame", retImg.img);
                const key = cv.waitKey(1);

                done = key !== -1 && key !== 255;
                if (done) {
                    clearInterval(intvl);
                    callback(-100);
                }
            }, 0);
        }
        catch(ex){
            console.log(" Debug: Error with live camera: ", ex);
        }
    }


    /*** Private Functions ***/

    /* Process Recognition Images */
    _processRecognitionImgs(baseLoc, finalLoc){
        var self = this;
        var resizeMax = 350;
        try {
            // Read In file Location
            const imgFiles = fs.readdirSync(baseLoc);

            // Clean Face Images
            for(var i =0; i < imgFiles.length; i++){
                var filePath = path.resolve(baseLoc, imgFiles[i]);
                var imgMat = cv.imread(filePath);
                var grayImg = imgMat.resizeToMax(resizeMax).bgrToGray();

                const faceRects = self.facialClassifier.detectMultiScale(grayImg).objects;
                if (!faceRects.length) {
                    console.log("Couldn't process: ", imgFiles[i]);
                } else {
                    var finalPath = path.resolve(finalLoc, imgFiles[i]);
                    if(!fs.existsSync(finalPath)){
                        // Resize Img + Save Image To New Location
                        cv.imwrite(finalPath, imgMat.resizeToMax(resizeMax));
                    }
                }
            }
        }
        catch(ex){
            console.log(" Debug Error processing REcognition Images: ", ex);
        }

        return "completed";
    }

    /* Facial Recognize MAT */
    faceRecogImg(recogImg, recogData, minDetections){
        var self = this;
        var ret = {"img":null, "names":[]};

        try {  
            const result = self.facialClassifier.detectMultiScale(recogImg.bgrToGray());
            
            result.objects.forEach((faceRect, i) => {        
                /*if (result.numDetections[i] < minDetections) { return; }*/
                
                const faceImg = recogImg.getRegion(faceRect).bgrToGray().resize(self.imgResize, self.imgResize);
                //var predition = recogData.eigenRecognizer.predict(faceImg);
                var predition = recogData.lbph.predict(faceImg);
                //const who = (result.numDetections[i] < minDetections ? "not sure?" : self.nameMappings[predition.label]);
                const who = (predition.confidence > minDetections ? "not sure?" : self.nameMappings[predition.label]);

                ret.names.push(who);
                var rect = cv.drawDetection(recogImg, faceRect, { color: self.PhoebeColor, segmentFraction: 4 });

                cv.drawTextBox(recogImg,
                    new cv.Point(rect.x, rect.y + rect.height + 10),
                    [{ text: who, fontSize: 0.6 }], 0.4);
                    //[{ text: who +" ["+predition.confidence+"]", fontSize: 0.6 }], 0.4);
            });

            ret.img = recogImg;
        }
        catch(ex){
            console.log("Error Recognizing Imgs: ",ex);
        }
        return ret;
    }

    /* Load Recog Training Data */
    _loadRecogTrainingData(){
        var self = this;
        var ret = { "lbph": new cv.LBPHFaceRecognizer(), "eigenRecognizer":new cv.EigenFaceRecognizer()};

        try {
            const imgFiles = fs.readdirSync(self.photoMemory);
                        
            // Get Face Images
            const getFaceImage = (grayImg) => {
                const faceRects = self.facialClassifier.detectMultiScale(grayImg).objects;
                if (!faceRects.length) {
                  throw new Error('failed to detect faces');
                }
                return grayImg.getRegion(faceRects[0]);
            };

            const trainImgs = imgFiles
                // get absolute file path
                .map(file => path.resolve(self.photoMemory, file))
                // read image
                .map(filePath => cv.imread(filePath))
                // face recognizer works with gray scale images
                .map(img => img.bgrToGray())
                // detect and extract face
                .map(getFaceImage)
                // face images must be equally sized
                .map(faceImg => faceImg.resize(self.imgResize, self.imgResize));

            // make labels
            const labels = imgFiles
                .map(file => self.nameMappings.findIndex(name => file.includes(name)));

            ret.lbph.train(trainImgs, labels);
            ret.eigenRecognizer.train(trainImgs, labels);
        }
        catch(ex){
            console.log("Error Loading Training Recog Data: ", ex);
        }

        return ret;
    }

    /* Face Mark MAT */
    facemarkImg(img, resize, facemark){
        var self = this;
        var ret = {"img":null, "total":0};

        try {
            if (!cv.xmodules.face) {
                throw new Error("opencv4nodejs compiled without face module");
            }

            if (!fs.existsSync(this.facemarkModel)) {
                //https://raw.githubusercontent.com/kurnianggoro/GSOC2017/master/data/lbfmodel.yaml
                throw new Error("Could not find landmarks model");
            }

            // resize image
            var image = (resize ? self._sizeImg(img): img);
            
            const gray = image.bgrToGray();
            const faces = facemark.getFaces(gray);
            
            // use the detected faces to detect the landmarks
            const faceLandmarks = facemark.fit(gray, faces);
            
            for (let i = 0; i < faceLandmarks.length; i++) {
                const landmarks = faceLandmarks[i];
                image = self._drawLandmarks(image, landmarks, true);
            }

            ret.total = faceLandmarks.length;
            ret.img = image;
        }
        catch(ex){
            console.log(" Debug: Error facemarking image: ", ex);
        }

        return ret;
    }

    /* Load Face Mark */
    loadFacemark(){
        var self = this;
        const facemark = new cv.FacemarkLBF();

        try {
            // create the facemark object with the landmarks model            
            facemark.loadModel(this.facemarkModel);

            // give the facemark object it's face detection callback
            facemark.setFaceDetector(frame => {
                const { objects } = self.facialClassifier.detectMultiScale(frame, 1.07);
                return objects;
            });
        }
        catch(ex){
            console.log(" Debug: Error Loading Face Mark: ", ex);
        }

        return facemark;
    }

    /* Size Mat to fit screen */
    _sizeImg(img){
        var retImg;
        var self = this;
        
        try {
            const mainScreen = screen.main();
            retImg = (mainScreen.width < img.cols ? self._sizeImg(img.rescale(.7)): img);
        }
        catch(ex){
            console.log("Error resizing image: ", ex);
            retImg = img;
        }
        return retImg;
    }

    /* Draw facial landmark lines */
    _drawLandmarks(img, landmarks, lines){
        var self= this;

        try {
            if (landmarks.length == 68 && lines){                
                img = self._drawPolyline(img, landmarks, 0, 16);     // Jaw line
                img = self._drawPolyline(img, landmarks, 17, 21);    // Left eyebrow
                img = self._drawPolyline(img, landmarks, 22, 26);    // Right eyebrow
                img = self._drawPolyline(img, landmarks, 27, 30);    // Nose bridge
                img = self._drawPolyline(img, landmarks, 30, 35, true);    // Lower nose
                img = self._drawPolyline(img, landmarks, 36, 41, true);    // Left eye
                img = self._drawPolyline(img, landmarks, 42, 47, true);    // Right Eye
                img = self._drawPolyline(img, landmarks, 48, 59, true);    // Outer lip
                img = self._drawPolyline(img, landmarks, 60, 67, true);    // Inner lip
            }
            else {
                for (let x = 0; x < landmarks.length; x++) {
                    img.drawCircle(landmarks[x], 1, new cv.Vec(4,205,252), 1, cv.LINE_8);
                }
            }
            return img;
        }
        catch(ex){
            console.log("Error Drawing Landmark: ",ex);
        }
    }

    /* Draw Landmark Poly*/
    _drawPolyline(img, landmarks, start, end, isClosed = false){
        const points = new Array();
        try {
            for (var i = start; i <= end; i++){
                points.push(new cv.Point(landmarks[i].x, landmarks[i].y));
            }
            img.drawPolylines(new Array(points), isClosed, new cv.Vec(4,205,252), 1, cv.LINE_4);
        }
        catch(ex){
            console.log(" Debug: Error drawing polyline: ", ex);
        }
        return img;
    }

    /* Draw Rectangle */
    _drawRectAroundBlobs(binaryImg, dstImg, minPxSize, fixedRectWidth){
        var self = this;
        var motionNum = 0;

        const {
          centroids,
          stats
        } = binaryImg.connectedComponentsWithStats();
      
        // pretend label 0 is background
        for (let label = 1; label < centroids.rows; label += 1) {
          const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
          const [x2, y2] = [
            x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
            y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
          ];
          const size = stats.at(label, cv.CC_STAT_AREA);
          
          if (minPxSize < size) {
            dstImg.drawRectangle(
              new cv.Point(x1, y1),
              new cv.Point(x2, y2),
              { color: self.PhoebeColor, thickness: 2 }
            );
            motionNum++;
          }
        }

        return motionNum;
    }

}

module.exports = JEYES;