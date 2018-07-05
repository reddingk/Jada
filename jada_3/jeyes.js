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
        this.facemarkModel = __dirname+"/config/data/lbfmodel.yaml";
        this.photoMemory = __dirname + "/config/data/photoMemory";
        this.PhoebeColor = new cv.Vec(4,205,252);
    }

    /* Facial Recognition */
    facialRecognition(file){
        var self = this;
        const nameMappings = ['grace', 'kris', 'jason'];

        var ret=[];
        try {
            if (!fs.existsSync(file)){
                throw new Error("could not find file: " + file);
            }

            const imgFiles = fs.readdirSync(self.photoMemory);
            //console.log(imgFiles);
            var tmp = 0;
            
            const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
            // Get Face Images
            const getFaceImage = (grayImg) => {
                const faceRects = classifier.detectMultiScale(grayImg).objects;
                tmp++;
                if (!faceRects.length) {
                 console.log("Image: ", tmp);
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
                .map(faceImg => faceImg.resize(80, 80));

            // make labels
            const labels = imgFiles
                .map(file => nameMappings.findIndex(name => file.includes(name)));

            const lbph = new cv.LBPHFaceRecognizer();

            lbph.train(trainImgs, labels);

            var recogImg = self._sizeImg(cv.imread(file));
            const result = classifier.detectMultiScale(recogImg.bgrToGray());

            const minDetections = 20;
            result.objects.forEach((faceRect, i) => {
        
                if (result.numDetections[i] < minDetections) {
                    return;
                }
                
                const faceImg = recogImg.getRegion(faceRect).bgrToGray();
                const who = nameMappings[lbph.predict(faceImg).label];

                console.log("name: ", who, " | ", result.numDetections[i]);

                ret.push(who);
                const rect = cv.drawDetection(recogImg, faceRect, { color: self.PhoebeColor, segmentFraction: 4 });

                const alpha = 0.4;
                cv.drawTextBox(recogImg,
                    new cv.Point(rect.x, rect.y + rect.height + 10),
                    [{ text: who }],
                    alpha
                );
            });

            cv.imshowWait('result', recogImg);
        }
        catch(ex){
            console.log(" Debug Error With Facial Recognition: ", ex);
        }

        return ret;
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
                cv.imshow("Live Camera Frame", retImg.img);
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
    /* Face Net MAT */
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
            const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

            // create the facemark object with the landmarks model            
            facemark.loadModel(this.facemarkModel);

            // give the facemark object it's face detection callback
            facemark.setFaceDetector(frame => {
                const { objects } = classifier.detectMultiScale(frame, 1.07);
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

}

module.exports = JEYES;