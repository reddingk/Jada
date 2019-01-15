'use strict';
/*
 * JADA EYES CLASS
 * By: Kris Redding
 */

const cv = require("opencv4nodejs");
const fs = require("fs");
const path = require("path");
const screen = require("screen-info");
const modelLib = require("./config/data/modellib.json");
const defaultCamPort = 1;

class JEYES {
    constructor(){
        this.facialClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
        this.facemarkModel = __dirname+"/config/data/lbfmodel.yaml";
        this.photoMemory = __dirname + "/config/data/photoMemory";
        this.PhoebeColor = new cv.Vec(4,205,252);
        this.foundColor = new cv.Vec(102,51,0);
        this.bgSubtractor = new cv.BackgroundSubtractorMOG2();

        this.imgResize = 80;
        this.minDetections = 120;
        this.nameMappings = {"map":{},"list":[]};
        this.modelLibrary = modelLib;
                           
        this.recogData = _loadRecogTrainingData(this.photoMemory, this.nameMappings, this.imgResize, this.facialClassifier)  
        this.markData = _loadFacemark(this.facialClassifier, this.facemarkModel);
    }

    /* EXTERNAL FUNCTIONS */
    /* Motion Track MAT */
    motionTrackImg(frame){
        var self = this;
        var ret = {"img":null,"error":null};

        try {
            // Track motion
            const foreGroundMask = self.bgSubtractor.apply(frame);
            const iterations = 2;
            const dilated = foreGroundMask.dilate(
                cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
                new cv.Point(-1, -1),
                iterations
            );

            const blurred = dilated.blur(new cv.Size(10, 10));
            const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);

            const minPxSize = 4000;
            var movingTargets = _drawRectAroundBlobs(thresholded, frame, minPxSize, self.PhoebeColor);

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
            
            // set return image
            ret.img = frame;
        }
        catch(ex){
            console.log("Error Tracking IMG: ", ex);
            ret.error = ex;
        }
        return ret;
    }

    /* Facial Recognize MAT */
    faceRecogImg(recogImg){
        var self = this;
        var ret = {"img":null, "names":[], "error":null};

        try {  

            const result = self.facialClassifier.detectMultiScale(recogImg.bgrToGray());             

            result.objects.forEach((faceRect, i) => {  
                const faceImg = recogImg.getRegion(faceRect).bgrToGray().resize(self.imgResize, self.imgResize);
                
                var predition = self.recogData.lbph.predict(faceImg);
                
                const who = (predition.confidence > self.minDetections ? "not sure?" : self.nameMappings.list[predition.label]);
                const displayColor = (predition.confidence > self.minDetections ? self.PhoebeColor: self.foundColor);

                ret.names.push(who);
                
                var rect = cv.drawDetection(recogImg, faceRect, { color: displayColor, segmentFraction: 4 });
                
                cv.drawTextBox(recogImg,
                    new cv.Point(rect.x, rect.y + rect.height + 10),
                    [{ text: (who ? who : "not sure?"), fontSize: 0.6 }], 0.4);
            });
            
            ret.img = recogImg;
        }
        catch(ex){
            console.log("Error Recognizing Imgs: ", ex);
            ret.error = ex;
        }

        return ret;
    }

    /* Face Mark MAT */
    facemarkImg(img, resize){
        var self = this;
        var ret = {"img":null, "total":0, "error":null};
        
        var faceClassifierOpts = {
            minSize: new cv.Size(30, 30),
            scaleFactor: 1.126,
            minNeighbors: 1,
        }

        try {
            if (!cv.xmodules.face) {
                throw new Error("opencv4nodejs compiled without face module");
            }

            if (!fs.existsSync(self.facemarkModel)) {
                //https://raw.githubusercontent.com/kurnianggoro/GSOC2017/master/data/lbfmodel.yaml
                throw new Error("Could not find landmarks model");
            }

            // resize image
            var image = (resize ? _sizeImg(img): img);
            
            const gray = image.bgrToGray();
            
            //const faces = self.markData.getFaces(gray);
            const faces = self.facialClassifier.detectMultiScale(gray, faceClassifierOpts).objects;

            // use the detected faces to detect the landmarks
            const faceLandmarks = self.markData.fit(gray, faces);
            
            for (let i = 0; i < faceLandmarks.length; i++) {
                const landmarks = faceLandmarks[i];
                image = _drawLandmarks(image, landmarks, true);
            }

            ret.total = faceLandmarks.length;
            ret.img = image;
        }
        catch(ex){
            console.log(" Debug: Error facemarking image: ", ex);
            ret.error = ex;
        }

        return ret;
    }

    /* Edge Detection Img */
    edgeDetectionImg(img){
        var self = this;
        var ret = {"img":null, "error":null};

        try {
            const gray = img.bgrToGray();
            const cannyImg = img.canny(50, 100, 3, false);

            ret.img = cannyImg;
        }
        catch(ex){
            console.log(" Debug: Error edge detecting image: ", ex);
            ret.error = ex;
        }

        return ret;
    }

    modelMapImg(img, searchFilter, filter){
        var self = this;
        var ret = {"img":null, "error":null};

        try {
            if(!(filter in self.modelLibrary)){
                ret.error = "Not A Valid Model";
            }
            else {
                var model = self.modelLibrary[filter];

                if(!model.net){
                    const cfgFile =  __dirname + "/config/data/imgModels/" + model.configFile;
                    const weightsFile =  __dirname + "/config/data/imgModels/" + model.weightsFile;
                    const labelsFile = __dirname + "/config/data/imgModels/" + model.labelFile;

                    model.dataKey = fs.readFileSync(labelsFile).toString().split("\n");   
                    
                    // initialize darknet model from modelFile
                    model.net = self.modelLibrary[filter].net = cv.readNetFromDarknet(cfgFile, weightsFile);
                }
                // initialize darknet model from modelFile
                const allLayerNames = model.net.getLayerNames();
                const unconnectedOutLayers = model.net.getUnconnectedOutLayers();

                // determine only the *output* layer names that we need from YOLO
                const layerNames = unconnectedOutLayers.map(layerIndex => {
                    return allLayerNames[layerIndex - 1];
                });

                const size = new cv.Size(416, 416);
                const vec3 = new cv.Vec(0, 0, 0);
                const [imgHeight, imgWidth] = img.sizes;

                const inputBlob = cv.blobFromImage(img, 1 / 255.0, size, vec3, true, false);
                model.net.setInput(inputBlob);

                //console.time("model.net.forward");
                // forward pass input through entire network
                const layerOutputs = model.net.forward(layerNames);
                //console.timeEnd("model.net.forward");

                let boxes = [];
                let confidences = [];
                let classIDs = [];

                layerOutputs.forEach(mat => {
                    const output = mat.getDataAsArray();
                    output.forEach(detection => { 
                        const scores = detection.slice(5);
                        const maxScore = Math.max(...scores);
                        const classId = scores.indexOf(maxScore);
                        const confidence = scores[classId];

                        //const classId = _indexOf(scores, maxScore);
                        //const confidence = scores[classId][0];
                        //console.log(" -> Con :",confidence, "scores: ", scores.length, " dec: ", detection.length, " id: ", classId);

                        if (confidence > model.minConfidence) {
                            const box = detection.slice(0, 4);

                            const centerX = parseInt(box[0] * imgWidth);
                            const centerY = parseInt(box[1] * imgHeight);
                            const width = parseInt(box[2] * imgWidth);
                            const height = parseInt(box[3] * imgHeight);

                            const x = parseInt(centerX - width / 2);
                            const y = parseInt(centerY - height / 2);

                            boxes.push(new cv.Rect(x, y, width, height));
                            confidences.push(confidence);
                            classIDs.push(classId);

                            const indices = cv.NMSBoxes(
                                boxes, confidences,
                                model.minConfidence, model.nmsThreshold
                            );
                            
                            indices.forEach(i => { 
                                var text = model.dataKey[classIDs[i]];
                                text = text.replace(/(?:\\[rn]|[\r\n])/g,"");
                                
                                if(searchFilter.length == 0 || (searchFilter.indexOf(text) >= 0)){
                                    const rect = boxes[i];

                                    const pt1 = new cv.Point(rect.x, rect.y);
                                    const pt2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                                    const org = new cv.Point(rect.x, rect.y + 15);
                                    const fontFace = cv.FONT_HERSHEY_SIMPLEX;

                                    // draw the rect for the object
                                    img.drawRectangle(pt1, pt2, self.PhoebeColor, 2, 2);                                

                                    // put text on the object
                                    img.putText((!text ?  "???": text), org, fontFace, 0.6, self.PhoebeColor, 2);
                                }
                            });
                        }
                    });
                });
                ret.img = img;
            }
        }
        catch(ex){
            console.log(" Debug: Error library mapping image: ", ex);
            ret.error = ex;
        }
        return ret;
    }

    /* Update Facial Recognition Library */
    updateRecognizeImg(img, facelist){
        var self = this;
        var status = false;

        try {
            for(var i =0; i < facelist.length; i++){
                // crop mini img from lrg img
                // if name in list
                    // compare mini image to user images | process img | add image to photo lib | reload this.recogData
                // else
                    // add name to list | process img | add image to photo lib | reload this.recogData
            }
            status = true;
        }
        catch(ex){
            console.log("Error updating Recog Lib: ", ex);
            status = false;
        }

        return status;
    }

    /* Base64 Img to Mat Img*/
    b64toMat(base64txt){
        try {
            const base64data = base64txt.replace('data:image/jpeg;base64','')
                .replace('data:image/png;base64','');
            const buffer = Buffer.from(base64data,'base64');
            const image = cv.imdecode(buffer);
            return image;
        }
        catch(ex){
            return null;
        }
    }

    /* Base64 Img to Mat Img*/
    matTob64(matImg){
        try {
            var outBase64 =  cv.imencode('.jpg', matImg).toString('base64');
            var fullBase64 = (!outBase64.startsWith("data:image/jpeg;base64,") ? "data:image/jpeg;base64," + outBase64 : outBase64);

            return fullBase64;
        }
        catch(ex){
            console.log(" Error convert mat to base 64: ", ex);
            return null;
        }
    }

    /* INTERNAL FUNCTIONS */   
    /* Motion Tracking */
    motionTrackingCamera(callback){
        var self = this;

        try{
            let done = false;
            var delay = 50;

            var camera = new cv.VideoCapture(defaultCamPort);
            
            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }

                // Motion Tracking
                let retFrame = self.motionTrackImg(frame);

                // Stream Or View Locally
                cv.imshow("Motion Camera Frame", retFrame);
                
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
        
        var result = null;
        try {
            if (!fs.existsSync(file)){
                throw new Error("could not find file: " + file);
            }             

            const recogImg = _sizeImg(cv.imread(file));
            result = self.faceRecogImg(recogImg, self.recogData);

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
            var retImg = self.facemarkImg(img, true);

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
            var camera = new cv.VideoCapture(defaultCamPort);

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }

                // resize image
                frame = _sizeImg(frame);

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
            var camera = new cv.VideoCapture(defaultCamPort);

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                
                // Facemark Image
                var retImg = self.facemarkImg(frame, true);

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

        try{
            let done = false;
            var camera = new cv.VideoCapture(defaultCamPort);
            //var camera = new cv.VideoCapture("http://10.0.0.10:8080/videofeed");

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                
                // Face Recognize Image
                var retImg = self.faceRecogImg(frame);

                // Resize Img
                retImg.img = _sizeImg(retImg.img);
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

    /* Edge Detection Camera */
    edgeDetectiongCamera(callback){
        var self = this;
        
        try{
            let done = false;
            var camera = new cv.VideoCapture(defaultCamPort);

            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                
                // Facemark Image
                var retImg = self.edgeDetectionImg(frame);

                // Stream Or View Locally
                cv.imshow("Edge Detection Frame", retImg.img);
                const key = cv.waitKey(1);

                done = key !== -1 && key !== 255;
                if (done) {
                    clearInterval(intvl);
                    callback(-100);
                }
            }, 0);
        }
        catch(ex){
            console.log(" Debug: Error with edge detection camera: ", ex);
        }
    }

    /* Model Img Camera */
    modelImgCamera(lib, searchFilter, callback){
        var self = this;

        try{
            let done = false;
            var camera = new cv.VideoCapture(defaultCamPort);
            
            const intvl = setInterval(function() {
                let frame = camera.read();

                if (frame.empty) {
                    camera.reset();
                    frame = camera.read();
                }
                
                // Face Recognize Image
                var retImg = self.modelMapImg(frame, searchFilter, lib);

                if(retImg.error){
                    done = true;
                }
                else{
                    // Resize Img
                    retImg.img = _sizeImg(retImg.img);
                    // Stream Or View Locally
                    cv.imshow("Facial Recognition Frame", retImg.img);
                    const key = cv.waitKey(1);
                    done = key !== -1 && key !== 255;
                }
               
                if (done) {
                    clearInterval(intvl);
                    callback(-100);
                }
            }, 0);
        }
        catch(ex){
            console.log(" Debug: Error with model camera: ", ex);
        }
    }
}

module.exports = JEYES;

/* Private Functions */
/* Special Index */
function _indexOf(obj, val){
    try {
        for(var i =0; i < obj.length; i++){
            if(obj[i] == val){
                return i;
            }
        }
    }
    catch(ex){
        console.log("Error getting special Index: ", ex);
    }
    return -1;
}

/* Load Face Mark */
function _loadFacemark(facialClassifier, facemarkModel){
    const facemark = new cv.FacemarkLBF();
    
    try {
        // create the facemark object with the landmarks model            
        facemark.loadModel(facemarkModel);

        // give the facemark object it's face detection callback
        /*facemark.setFaceDetector(frame => {
            const { objects } = facialClassifier.detectMultiScale(frame, 1.07);
            return objects;
        });*/
    }
    catch(ex){
        console.log(" Debug: Error Loading Face Mark: ", ex);
    }

    return facemark;
}

/* Size Mat to fit screen */
function _sizeImg(img){
    var retImg;
    
    try {
        const mainScreen = screen.main();
        retImg = (mainScreen.width < img.cols ? _sizeImg(img.rescale(.7)): img);
    }
    catch(ex){
        console.log("Error resizing image: ", ex);
        retImg = img;
    }
    return retImg;
} 

/* Build Name Map */
function _buildNameMap(photoMemory){
    var nameObj = {};
    try {       
        const mapImgName = (name) => {
            name = path.win32.basename(name, '.PNG');
            name = name.split('-')[0];

            if(!(name in nameObj)){ nameObj[name] = 1; }
            else { nameObj[name] = nameObj[name] +1; }
        };

        const imgFiles = fs.readdirSync(photoMemory);

        imgFiles
        .map(file => path.resolve(photoMemory, file))
        .map(mapImgName);
    }
    catch(ex){
        console.log("Error building name map: ", ex);
    }
    return nameObj;
}

/* Load Recog Training Data */
function _loadRecogTrainingData(photoMemory, nameMappings, imgResize, facialClassifier){
    var ret = { "lbph": new cv.LBPHFaceRecognizer(), "eigenRecognizer":new cv.EigenFaceRecognizer()};

    try {
        nameMappings.map = ((Object.keys(nameMappings.map).length === 0) ? _buildNameMap(photoMemory) : nameMappings.map);        
        nameMappings.list = Object.keys(nameMappings.map);

        const imgFiles = fs.readdirSync(photoMemory);
                    
        // Get Face Images
        const getFaceImage = (grayImg) => {
            const faceRects = facialClassifier.detectMultiScale(grayImg).objects;
            if (!faceRects.length) {
              throw new Error('failed to detect faces');
            }
            return grayImg.getRegion(faceRects[0]);
        };

        const trainImgs = imgFiles
            // get absolute file path
            .map(file => path.resolve(photoMemory, file))
            // read image
            .map(filePath => cv.imread(filePath))
            // face recognizer works with gray scale images
            .map(img => img.bgrToGray())
            // detect and extract face
            .map(getFaceImage)
            // face images must be equally sized
            .map(faceImg => faceImg.resize(imgResize, imgResize));

        // make labels
        const labels = imgFiles
            .map(file => nameMappings.list.findIndex(name => file.includes(name)));

        ret.lbph.train(trainImgs, labels);
        ret.eigenRecognizer.train(trainImgs, labels);
    }
    catch(ex){
        console.log("Error Loading Training Recog Data: ", ex);
    }

    return ret;
}

/* Draw Rectangle */
function _drawRectAroundBlobs(binaryImg, dstImg, minPxSize, fixedRectWidth, color){
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
          { color: color, thickness: 2 }
        );
        motionNum++;
      }
    }

    return motionNum;
}

/* Draw Landmark Poly*/
function _drawPolyline(img, landmarks, start, end, isClosed = false){
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

 /* Draw facial landmark lines */
 function _drawLandmarks(img, landmarks, lines){        
    try {
        if (landmarks.length == 68 && lines){                
            img = _drawPolyline(img, landmarks, 0, 16);     // Jaw line
            img = _drawPolyline(img, landmarks, 17, 21);    // Left eyebrow
            img = _drawPolyline(img, landmarks, 22, 26);    // Right eyebrow
            img = _drawPolyline(img, landmarks, 27, 30);    // Nose bridge
            img = _drawPolyline(img, landmarks, 30, 35, true);    // Lower nose
            img = _drawPolyline(img, landmarks, 36, 41, true);    // Left eye
            img = _drawPolyline(img, landmarks, 42, 47, true);    // Right Eye
            img = _drawPolyline(img, landmarks, 48, 59, true);    // Outer lip
            img = _drawPolyline(img, landmarks, 60, 67, true);    // Inner lip
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

/* Process Recognition Images */
function _processRecognitionImgs(baseLoc, finalLoc, facialClassifier){
    var resizeMax = 350;
    try {
        // Read In file Location
        const imgFiles = fs.readdirSync(baseLoc);

        // Clean Face Images
        for(var i =0; i < imgFiles.length; i++){
            var filePath = path.resolve(baseLoc, imgFiles[i]);
            var imgMat = cv.imread(filePath);
            var grayImg = imgMat.resizeToMax(resizeMax).bgrToGray();

            const faceRects = facialClassifier.detectMultiScale(grayImg).objects;
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