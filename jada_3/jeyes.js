'use strict';
/*
 * JADA EYES CLASS
 * By: Kris Redding
 */

const cv = require("opencv4nodejs");
const tesseract = require('tesseract.js');
const fs = require("fs");
const path = require("path");
const Tools = require('./jtools.js');

const configLoc = (process.env.CONFIG_LOC ? process.env.CONFIG_LOC : "/jada/localConfig");
const modelLib = require(configLoc+"/config/data/modellib.json");
const defaultCamPort = 1;

const jtools = new Tools();


class JEYES {
    constructor(){
        // cv.HAAR_FRONTALFACE_ALT
        this.facialClassifier = new cv.CascadeClassifier(configLoc+"/config/data/visionary_cascade.xml");
        this.facemarkModel = configLoc+"/config/data/lbfmodel.yaml";
        this.textDetectionModel = configLoc+"/config/data/frozen_east_text_detection.pb";
        this.photoMemory = configLoc + "/config/data/photoMemory";
        this.imgIndexModel = configLoc + "/config/data/imgIndex.json";
        
        this.SusieColor = new cv.Vec(4,205,252);
        this.foundColor = new cv.Vec(102,51,0);
        this.bgSubtractor = new cv.BackgroundSubtractorMOG2();

        this.imgResize = 80;
        this.minDetections = 120;
        this.nameMappings = {"map":{},"list":[]};
        this.imgIndex = { "data":{}};
        this.modelLibrary = modelLib;
        this.recogList = [
            {"name":"lbph", "minDetections": 100 },
            {"name":"eigenRecognizer", "minDetections": 2000 },
            {"name":"fisherRecognizer", "minDetections": 320 },
        ];
                           
        this.recogData = _loadRecogTrainingData(this.photoMemory, this.imgIndex, this.nameMappings, this.imgResize, this.facialClassifier, this.imgIndexModel);  
        this.markData = _loadFacemark(this.facialClassifier, this.facemarkModel);
        this.textDetect = _loadTextDetection(this.textDetectionModel);
        this.objDetect = {};
    }

    /* EXTERNAL FUNCTIONS */
    /* Motion Track prev to next */

    motionTrackImgs(frame, prevFrame){
        var self = this;
        var ret = {"prevFrame":prevFrame, "img":null, "motionFlg":false, "error":null};
        const motionDelta = 1300;

        try {
            ret.prevFrame = frame.copy();
            var gray = frame.copy();

            //convert to grayscale
            prevFrame.bgrToGray();
            prevFrame.blur(new cv.Size(21, 21));

            gray.bgrToGray();
            gray.blur(new cv.Size(21, 21));

            //compute difference between first frame and current frame
            var frameDelta = prevFrame.absdiff(gray);
            var thresh = frameDelta.threshold(25,255, cv.THRESH_BINARY);

            thresh.dilate(
                cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
                new cv.Point(-1, -1), 2);
                    
            // Get Difference Count        
            thresh = thresh.bgrToGray();
            let contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            var motionContour = contours.filter(function(item){ return item.area > motionDelta; });
            var contourPts = contours.map((contour) => { return contour.getPoints(); });

            ret.motionFlg = (motionContour.length > 0);
            if(ret.motionFlg) { 
                console.log(" [Motion]: ", contourPts.length); 
                //console.log(contourPts);
                contourPts.forEach(function(dataPt){ console.log(_motionStats(dataPt)); });                
            }

            frame.drawContours(contourPts, -1, self.SusieColor, { thickness: 1 });

            // set return image
            ret.img = frame;
        }
        catch(ex){
            jtools.errorLog(" [ERROR] Tracking IMG: " + ex);
            ret.error = ex;
        }

        return ret;
    }

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
            var movingTargets = _drawRectAroundBlobs(thresholded, frame, minPxSize, self.SusieColor);

            // Draw number of moving targets
            frame.drawRectangle(
                new cv.Point(10, 10), new cv.Point(70, 70),
                { color: self.SusieColor, thickness: 2 }
            );
            frame.putText(
                String(movingTargets),
                new cv.Point(20, 60), cv.FONT_ITALIC, 2,
                { color: self.SusieColor, thickness: 2 }
            );
            
            // set return image
            ret.img = frame;
        }
        catch(ex){
            jtools.errorLog(" [ERROR] Tracking IMG: " + ex);
            ret.error = ex;
        }
        return ret;
    }

    /* Process Recognition Img */
    processRecognitionImgs(sourcePath, destinationPath, callback){
        var self = this;
        var ret = { "error":"", "processedImgs":0, "unprocessedImgs":0 };
        var resizeMax = 650;

        try {
            // Read In file Location
            const imgFiles = fs.readdirSync(sourcePath);

            // Process All Imgs
            for(var i =0; i < imgFiles.length; i++){
                var filePath = path.resolve(sourcePath, imgFiles[i]);
                var imgMat = _sizeImg(cv.imread(filePath));
                var grayImg = imgMat.bgrToGray();

                console.log("File ", i, ":",filePath);
                const faceResults = self.facialClassifier.detectMultiScale(grayImg);

                if (!faceResults.objects.length) {
                    ret.unprocessedImgs = ret.unprocessedImgs + 1;
                }
                else {
                    faceResults.objects.forEach((faceRect, j) => { 
                        
                        const faceImg = grayImg.getRegion(faceRect).resize(self.imgResize, self.imgResize);
                        var displayImg = imgMat.getRegion(faceRect);

                        var predition = self.recogData.lbph.predict(faceImg);
                        const who = (predition.confidence > self.minDetections ? null : self.nameMappings.list[predition.label]);

                        var imgNm = "";
                        if(who == null){
                            // Unrecognized Face
                            imgNm = Date.now() + j;
                        }
                        else {
                            // Recognized Face
                            self.nameMappings.map[who] = self.nameMappings.map[who] + 1;
                            imgNm = who + "-" + self.nameMappings.map[who];
                        }

                        // Save Image                                    
                        var fileNm = destinationPath+"\\"+imgNm +".png";                                                     
                        cv.imwrite(fileNm, displayImg.resizeToMax(resizeMax));
                    });
                    ret.processedImgs = ret.processedImgs + 1;
                }
            }
        }
        catch(ex){
            jtools.errorLog(" [ERROR] Processing Recognizing Imgs: " + ex);
            ret.error = ex;
        }
        callback(ret);
    }

    /* Facial Recognize MAT */
    faceRecogImg(recogImg){
        var self = this;
        var ret = {"img":null, "names":[], "error":null};

        try {  
            recogImg = recogImg.resizeToMax(640);
            const result = self.facialClassifier.detectMultiScale(recogImg.bgrToGray());             
            result.objects.forEach((faceRect, i) => {  
                const faceImg = recogImg.getRegion(faceRect).bgrToGray().resize(self.imgResize, self.imgResize);
                
                var predictionMap = {};
                var who = null;
                var displayColor = self.foundColor;
                var tmpWho;

                for(var j =0; j < self.recogList.length; j++){
                    tmpWho = null;
                    var tmpPrediction = self.recogData[self.recogList[j].name].predict(faceImg);  
                    
                    if(Math.round(tmpPrediction.confidence) >= self.recogList[j].minDetections){
                        tmpWho = _getImgInfo(self.nameMappings.list[tmpPrediction.label], self.imgIndex.data);
                        predictionMap[tmpWho] = (tmpWho in predictionMap ? predictionMap[tmpWho] + 1 : 1);
                    }
    
                    if(tmpWho && predictionMap[tmpWho] > 1){ who = tmpWho; break; }
                }

                
                displayColor = (who ? self.SusieColor: self.foundColor);
                
                if(who){ ret.names.push(who); }
                var rect = cv.drawDetection(recogImg, faceRect, { color: displayColor, segmentFraction: 4 });

                cv.drawTextBox(recogImg,
                    new cv.Point(rect.x, rect.y + rect.height + 10),
                    [{ text: (who ? who : "not sure?"), fontSize: 0.6 }], 0.4);
            });
            
            ret.img = recogImg;
        }
        catch(ex){
            jtools.errorLog(" [ERROR] Recognizing Imgs: " + ex);
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
            scaleFactor: 1.126, minNeighbors: 1,
        }

        try {
            /*if (!cv.xmodules.face) {
                throw new Error("opencv4nodejs compiled without face module");
            }*/

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
            jtools.errorLog(" [ERROR] facemarking image: " + ex);
            ret.error = ex;
        }

        return ret;
    }

    /* Edge Detection Img */
    edgeDetectionImg(img){
        var ret = {"img":null, "error":null};

        try {
            const gray = img.bgrToGray();
            const cannyImg = gray.canny(50, 100, 3, false);

            ret.img = cannyImg;
        }
        catch(ex){
            jtools.errorLog(" [ERROR] edge detecting image: " + ex);
            ret.error = ex;
        }

        return ret;
    }

    /* modelMap Img */
    modelMapImg(img, searchFilter, filter){
        var self = this;
        var ret = {"img":null, "layers":[], "error":null};

        try {            
            if(!(filter in self.modelLibrary)){
                ret.error = "Not A Valid Model";
            }
            else {
                var model = self.modelLibrary[filter];

                if(!model.net){
                    const cfgFile =  configLoc + "/config/data/imgModels/" + model.configFile;
                    const weightsFile =  configLoc + "/config/data/imgModels/" + model.weightsFile;
                    const labelsFile = configLoc + "/config/data/imgModels/" + model.labelFile;

                    model.dataKey = fs.readFileSync(labelsFile).toString().split("\n");   

                    // initialize darknet model from modelFile
                    if(!self.modelLibrary[filter].net) {
                        self.modelLibrary[filter].net = cv.readNetFromDarknet(cfgFile, weightsFile);
                    }

                    model.net = self.modelLibrary[filter].net;

                    // initialize darknet model from modelFile
                    const allLayerNames = model.net.getLayerNames();
                    const unconnectedOutLayers = model.net.getUnconnectedOutLayers();

                    // determine only the *output* layer names that we need from YOLO
                    model.layerNames = unconnectedOutLayers.map(layerIndex => {
                        return allLayerNames[layerIndex - 1];
                    });
                }
                
                const size = new cv.Size(416, 416);
                const vec3 = new cv.Vec(0, 0, 0);
                img = img.resizeToMax(640);
                const [imgHeight, imgWidth] = img.sizes;

                const inputBlob = cv.blobFromImage(img, 1 / 255.0, size, vec3, true, false);
                model.net.setInput(inputBlob);

                // forward pass input through entire network
                const layerOutputs = model.net.forward(model.layerNames);
               
                let boxes = [], confidences = [], classIDs = [];

                layerOutputs.forEach(mat => {
                    const output = mat.getDataAsArray();

                    output.forEach(detection => { 
                        const scores = detection.slice(5);
                        const maxScore = Math.max(...scores);
                        const classId = scores.indexOf(maxScore);
                        const confidence = scores[classId];

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

                            const indices = cv.NMSBoxes(boxes, confidences, model.minConfidence, model.nmsThreshold);
                            
                            indices.forEach(i => { 
                                var text = model.dataKey[classIDs[i]];
                                text = text.replace(/(?:\\[rn]|[\r\n])/g,"");
                                
                                if(searchFilter == null || (text in searchFilter)){
                                    const rect = boxes[i];

                                    const pt1 = new cv.Point(rect.x, rect.y);
                                    const pt2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);                                                                  
                                    const org = new cv.Point(rect.x, rect.y + 15);
                                    const fontFace = cv.FONT_HERSHEY_SIMPLEX;
                                    
                                    // draw the rect for the object
                                    img.drawRectangle(pt1, pt2, self.SusieColor, 2, 2);
                                    // put text on the object
                                    img.putText((!text ?  "???": text), org, fontFace, 0.6, self.SusieColor, 2);
                                    
                                    // Set Return Image   
                                    ret.layers.push({"rect":rect, "title":(!text ?  "???": text) });                                               
                                }
                            });
                        }
                    });
                });
                ret.img = img; 
            }
        }
        catch(ex){
            jtools.errorLog(" [ERROR] library mapping image: " + ex);
            ret.error = ex;
        }

        return ret;
    }

    /* Read Image Text */
    readImageText(retImg, callback){
        var ret = {"txt":null, "img":null, "error":null};
         
        try {
            var txtList = [];
            var img = ret.img = retImg.img;
            // detect text in IMG
            const SIZE = 320;
            const outBlobNames = ['feature_fusion/Conv_7/Sigmoid','feature_fusion/concat_3',];
            const MIN_CONFIDENCE = 0.5;
            const NMS_THRESHOLD = 0.4;

            const [imgHeight, imgWidth] = img.sizes;
            const widthRatio = imgWidth / SIZE;
            const heightRatio = imgHeight / SIZE;

            const inputBlob = cv.blobFromImage(img, 1, new cv.Size(SIZE, SIZE), new cv.Vec3(123.68, 116.78, 103.94), true, false);
            this.textDetect.setInput(inputBlob);
            const [scores, geometry] = this.textDetect.forward(outBlobNames);
            const [boxes, confidences] = _decode(scores, geometry, MIN_CONFIDENCE);
            const indices = cv.NMSBoxes(boxes, confidences, MIN_CONFIDENCE, NMS_THRESHOLD);

            indices.forEach((i) => {
                const rect = boxes[i];
                var fixedX = (rect.x * widthRatio) - ((rect.x * widthRatio)*.02);
                var fixedY = rect.y * heightRatio - ((rect.y * heightRatio)*.02);
                var fixedW = rect.width * widthRatio + ((rect.width * widthRatio)*.1);
                var fixedH = rect.height * heightRatio + ((rect.height * heightRatio)*.4);

                const imgRect = new cv.Rect(fixedX, fixedY, fixedW, fixedH);
                
                // Crop Image
                var cropped = new cv.Mat(img.rows, img.cols, img.type, [255, 255, 255]);
                img.getRegion(imgRect).copyTo(cropped.getRegion(imgRect));
                
                // Upscale image
                const upscaleImg = cropped.rescale(3);
                
                // Process Img                 
                const imgToGry = upscaleImg.bgrToGray();
                const th1 = imgToGry.threshold(170, 255, cv.THRESH_BINARY);
                const th2 = th1.adaptiveThreshold(255,cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY,7,2);
                const th3 = th2.adaptiveThreshold(255,cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY,7,2);
                const filterRes =  th3;
                
                 
                /*const imgToGry = upscaleImg.bgrToGray();
                const th1 = imgToGry.threshold(100, 255, cv.THRESH_BINARY_INV);
                const filterRes =  th1;
                */

                // Save Image                                    
                var fileNm = configLoc+"\\fileCache\\"+Date.now() +".png";                                    
                cv.imwrite(fileNm, filterRes);

                // TEST
                cv.imwrite(configLoc+"\\fileCache\\"+i +"-"+Date.now() +"th0.png", imgToGry);
                cv.imwrite(configLoc+"\\fileCache\\"+i +"-"+Date.now() +"th1.png", th1);
                cv.imwrite(configLoc+"\\fileCache\\"+i +"-"+Date.now() +"th2.png", th2);

                tesseract.recognize(fileNm).then(function(result){
                    // Delete TMP Img
                    //fs.unlinkSync(fileNm);
                    txtList.push({"text":result.text, "id":i});
                    console.log(i,"] ",result.text);

                    if(txtList.length >= indices.length){
                        ret.txt = txtList.sort(function(a,b){ return a.id - b.id; }).map(function(item){ return item.text; }).join(",");
                        callback(ret);
                    }
                });

                //const pt1 = new cv.Point(imgRect.x, imgRect.y);
                //const pt2 = new cv.Point(imgRect.x + imgRect.width, imgRect.y + imgRect.height);                                                                  
                                    
                // draw the rect for the object
                //img.drawRectangle(pt1, pt2, self.SusieColor, 2, 2);
            });

            //ret.img = img;
            //cv.imshowWait("TEST FINAL Frame", _sizeImg(ret.img)); 
            //callback(ret);
        }
        catch(ex){
            jtools.errorLog(" [ERROR] Getting Image Text: " + ex);
            ret.error = ex;
            callback(ret);
        }
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
            jtools.errorLog(" [ERROR] updating Recog Lib: " + ex);
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
            jtools.errorLog(" [ERROR] convert mat to base 64: " + ex);
            return null;
        }
    }

    /* INTERNAL FUNCTIONS */   
    /* Motion Tracking */
    motionTrackingCamera(callback){
        var self = this;

        try{
            let done = false;
            var delay = 50, retryCnt = 0;

            var camera = new cv.VideoCapture(defaultCamPort);
            var prevFrame = camera.read();

            const intvl = setInterval(function() {
                let frame = camera.read();
                if(!prevFrame || prevFrame.empty) { prevFrame = frame.copy(); }

                if (frame.empty) {
                    try {
                        camera.reset();
                        frame = camera.read();
                        retryCnt = (frame === null || frame.empty ? retryCnt+1 : 0);
                    }
                    catch(frameEx){
                        retryCnt++;
                        console.log(" Video Load Retry #" + retryCnt);
                    }
                }

                if(retryCnt >= 3){ 
                    clearInterval(intvl);
                    callback(-100);
                }
                else if(retryCnt == 0){
                    // Motion Tracking
                    //let retFrame = self.motionTrackImg(frame);
                    let retFrame = self.motionTrackImgs(frame, prevFrame);
                    prevFrame = retFrame.prevFrame;

                    // Resize Img
                    //retFrame.img = _sizeImg(retFrame.img);

                    // Stream Or View Locally
                    cv.imshow("Motion Camera Frame", retFrame.img);
                    
                    const key = cv.waitKey(delay);
                    done = key !== -1 && key !== 255;
                    if (done) {
                        clearInterval(intvl);
                        callback(-100);
                    }
                }
            }, 0);
        }
        catch(ex){
            jtools.errorLog(" [ERROR] with motion tracking camera: " + ex);
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
            jtools.errorLog(" [ERROR] With Facial Recognition: " + ex);
        }

        return result.names;
    }
    /* Detect number of faces from image file */
    modelImgFile(lib, searchFilter, file, reader, callback){
        var self = this;
        try {
            if (!fs.existsSync(file)){
                throw new Error("could not find file: " + file);
            }
            // retrieve faces using the facemark face detector callback
            const img = cv.imread(file);
                        
            // Model Image
            var retImg = self.modelMapImg(img, searchFilter, lib);
                                
            if(retImg && retImg.img){
                // Resize Img & Show Img
                cv.imshowWait("Model Image Frame", _sizeImg(retImg.img));
                callback(retImg.layers);
            }

            if(!reader){
                callback("NO READER");
            }
            else {             
                /* Read IMG LOGIC */                                                        
                self.readImageText(retImg, function(dataRet){
                    callback(dataRet.txt);
                }); 
            }
            
        }
        catch(ex){
            jtools.errorLog(" [ERROR] Model Img: " + ex);
            callback(-1);
        }
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
            cjtools.errorLog(" [ERROR] Facemark: " + ex);
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
            jtools.errorLog(" [ERROR] with live camera: " + ex);
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
            jtools.errorLog(" [ERROR] with facemark camera: " + ex);
        }
    }
    /* OBJ Detect Camera */
    ObjDetectCamera(callback){
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
            jtools.errorLog(" [ERROR] with face recognition camera: " + ex);
        }
    }

    /* Facemark Camera */
    faceRecognizeCamera(callback){
        var self = this;
        var ret = { names:{}, status:false };
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
                var retImg = self.faceRecogImg(frame);

                // Resize Img
                retImg.img = _sizeImg(retImg.img);
                           
                retImg.names.forEach(function(name){
                    ret.names[name] = (name in ret.names ? ret.names[name]+1 : 1);
                });

                // Stream Or View Locally
                cv.imshow("Facial Recognition Frame", retImg.img);
                const key = cv.waitKey(1);

                done = key !== -1 && key !== 255;
                if (done) {
                    clearInterval(intvl);
                    ret.status = true;
                    callback(ret);
                }
            }, 0);
        }
        catch(ex){
            jtools.errorLog(" [ERROR] with face recognition camera: " + ex);
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
            jtools.errorLog(" [ERROR] with edge detection camera: " + ex);
        }
    }

    /* Model Img Camera */
    modelImgCamera(lib, searchFilter, reader, callback){
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
                    cv.imshow("Model Recognition Camera", retImg.img);
                    const key = cv.waitKey(1);
                    done = key !== -1 && key !== 255;
                }
                   
                if (done) {
                    clearInterval(intvl);
                    //callback(-100);
                    /* Read IMG LOGIC */
                    if(!reader){
                        callback("NO READER [2]");
                    }
                    else {             
                        /* Read IMG LOGIC */                                                        
                        self.readImageText(retImg, function(dataRet){
                            callback(dataRet.txt);
                        }); 
                    }
                }    
            }, 0);
        }
        catch(ex){
            jtools.errorLog(" [ERROR] with model camera: " + ex);
        }
    }

    /* Motion Details Camera */
    motionDetailsCamera(callback){
        var self = this;
        try {
            let done = false;
            var delay = 50, retryCnt = 0;

            var camera = new cv.VideoCapture(1);
            var retFrame = {frame: null, baseFrame: null, hasMotion: true};
            var prevFrame = camera.read();

            const intvl = setInterval(function() {
                let frame = camera.read();
                if(!prevFrame || prevFrame.empty) { prevFrame = frame.copy(); }

                if (frame.empty) {
                    try {
                        camera.reset();
                        frame = camera.read();
                        retryCnt = (frame === null || frame.empty ? retryCnt+1 : 0);
                    }
                    catch(frameEx){
                        retryCnt++;
                        console.log(" Video Load Retry #" + retryCnt);
                    }
                }

                if(retryCnt >= 3){ 
                    clearInterval(intvl);
                    callback(-100);
                }
                else if(retryCnt == 0){
                    // Motion Tracking
                    retFrame = _detectMotionDetail2(prevFrame, frame);
                    prevFrame = retFrame.prevFrame;

                    // Stream Or View Locally
                    cv.imshow("Motion Detail Frame", retFrame.frame);
                    
                    const key = cv.waitKey(delay);
                    done = key !== -1 && key !== 255;
                    if (done) {
                        clearInterval(intvl);
                        callback(-100);
                    }
                }
            }, 0);
        }
        catch(ex){
            jtools.errorLog(" [ERROR] with motion tracking camera: " + ex);
        }
    }
    
    /* Blind Eye Set Up */
    blindEye(videoLoc, callback){
        var self = this, retryCnt = 0, resizeMax = 640, done = false;
        var ret = { status:false, ptStatus: { x: { low: null, high: null}, y: { low: null, high:null }} };

        try {
            if(!fs.existsSync(videoLoc)){
                console.log("File DNE: " + videoLoc);
                callback(ret);
            }
            else {
                const cap = new cv.VideoCapture(videoLoc);

                var retFrame = {frame: null, baseFrame: null, hasMotion: true};
                var prevFrame = cap.read();

                console.log(" [Start Blind Process] ");
                while(!done){
                    let frame = cap.read();

                    if(!prevFrame || prevFrame.empty) { prevFrame = frame.copy(); }

                    if (frame.empty) {
                        try {
                            //cap.reset();
                            frame = cap.read();
                            retryCnt = (frame === null || frame.empty ? retryCnt+1 : 0);
                        }
                        catch(frameEx){
                            retryCnt++;
                            console.log(" Video Load Retry #" + retryCnt);
                        }
                    }

                    if(retryCnt >= 3){ done = true; break;}
                    else if(retryCnt == 0){
                        frame = frame.resizeToMax(resizeMax);  
                        prevFrame = prevFrame.resizeToMax(resizeMax);

                        retFrame = _detectMotionDetail(prevFrame, frame);
                        prevFrame = retFrame.prevFrame;

                        // Get Min & Max Pt
                        if(ret.ptStatus.x.low == null || (retFrame.ptStatus.x.low && retFrame.ptStatus.x.low < ret.ptStatus.x.low)) { ret.ptStatus.x.low = retFrame.ptStatus.x.low; console.log(" [Pt Change]"); console.log(ret.ptStatus); }
                        if(ret.ptStatus.x.high == null || (retFrame.ptStatus.x.high && retFrame.ptStatus.x.high > ret.ptStatus.x.high)) { ret.ptStatus.x.high = retFrame.ptStatus.x.high; console.log(" [Pt Change]"); console.log(ret.ptStatus);}
        
                        if(ret.ptStatus.y.low == null || (retFrame.ptStatus.y.low && retFrame.ptStatus.y.low < ret.ptStatus.y.low)) { ret.ptStatus.y.low = retFrame.ptStatus.y.low; console.log(" [Pt Change]"); console.log(ret.ptStatus);}
                        if(ret.ptStatus.y.high == null || (retFrame.ptStatus.y.high && retFrame.ptStatus.y.high > ret.ptStatus.y.high)) { ret.ptStatus.y.high = retFrame.ptStatus.y.high; console.log(" [Pt Change]"); console.log(ret.ptStatus);}

                        // [DEBUG] View Locally
                        cv.imshow("BlindEye frame", retFrame.frame);
                        const key = cv.waitKey(1);
                    }
                }

                console.log(" [End Blind Process] ");
                ret.status = true;
                callback(ret);
            }
        }
        catch(ex){
            console.log(" [ERROR] with blind eye: " + ex);
            callback(ret);
        }
    }

    /* Test */
    test(callback){
        callback("Done TEST");
    }
}

module.exports = JEYES;

/* Private Functions */
/* Remove Blind Eye Area */
function _clearBlindEyeData(blindpts, contour){
    var ret = contour;
    try {
        if(blindpts.length > 0) {
            //var motionContour = contours.filter(function(item){ return item.area > motionDelta; });
            //var contourPts = contours.map((contour) => { return contour.getPoints(); });

            for(var i =0; i < blindpts.length; i++){
                ret = ret.filter(function(contour){
                    var tmpLoc = contour.getPoints().filter(function(mcpt) {
                        var tx = mcpt.x < blindpts[i].low.x || mcpt.x > blindpts[i].high.x;
                        var ty = mcpt.y < blindpts[i].low.y || mcpt.y > blindpts[i].high.y;

                        return (tx || ty);
                    });

                    return tmpLoc.length > 0;
                });
            }
        }
    }
    catch(ex){
        console.log(" [Error] clearing blind eye: ",ex);
    }

    return ret;
}

/* Detect Motion Detail */
function _detectMotionDetail(prevFrame,frame){
    var ret = { prevFrame: frame, frame: frame, baseFrame: frame, hasMotion: false, ptStatus: {} };
    const tmpColor = new cv.Vec(0, 0, 255), motionDelta = 800;

    try {
        ret.ptStatus = { 
            x: { low: null, high: null},
            y: { low: null, high:null }
        }

        ret.prevFrame = frame.copy();
        ret.baseFrame = frame.copy();
        var gray = frame.copy();

        //convert to grayscale
        prevFrame.bgrToGray();
        prevFrame.blur(new cv.Size(21, 21));

        gray.bgrToGray();
        gray.blur(new cv.Size(21, 21));

        //compute difference between first frame and current frame
        var frameDelta = prevFrame.absdiff(gray);
        var thresh = frameDelta.threshold(25,255, cv.THRESH_BINARY);
        thresh.dilate(
            cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
            new cv.Point(-1, -1), 2);
                
        // Get Difference Count        
        thresh = thresh.bgrToGray();
        let contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        console.log("Before Clear: ", contours.length);
        contours = _clearBlindEyeData([{low: { x: 400, y: 120 }, high: { x: 500, y: 180 }}], contours);
        console.log("After Clear: ", contours.length);

        var motionContour = contours.filter(function(item){ return item.area > motionDelta; });
        var contourPts = contours.map((contour) => { return contour.getPoints(); });

        ret.hasMotion = motionContour.length > 0;
        ret.frame.drawContours(contourPts, -1, tmpColor, { thickness: 1 });
        
        console.log(" -> [Area]: "); console.log(contours.map(function(item){ return item.area; }));
        //console.log(" -> [Motion XY]: "); contourPts.forEach(function(pt){ console.log("PT: ", pt.map(function(item){ return "X:"+ item.x + " |Y: " + item.y; })); });
        //console.log(" -> [Motion P]: "); console.log(contourPts); 

        contourPts.forEach(function(pt){ 
            pt.forEach(function(item){ 
                //ptStatus
                if(ret.ptStatus.x.low == null || item.x < ret.ptStatus.x.low) { ret.ptStatus.x.low = item.x; }
                if(ret.ptStatus.x.high == null || item.x > ret.ptStatus.x.high) { ret.ptStatus.x.high = item.x; }

                if(ret.ptStatus.y.low == null || item.y < ret.ptStatus.y.low) { ret.ptStatus.y.low = item.y; }
                if(ret.ptStatus.y.high == null || item.y > ret.ptStatus.y.high) { ret.ptStatus.y.high = item.y; }
            }); 
        });

        if(ret.hasMotion){
            console.log(" -> [Motion C]: ", motionContour.length); //console.log(motionContour);   
        }

        // Draw Blind Spot
        const pt1 = new cv.Point(400, 100);
        const pt2 = new cv.Point(500, 180);                                                                 
                                    
        ret.frame.drawRectangle(pt1, pt2, tmpColor, 2, 2);     
    }
    catch(ex){
        console.log("Detection Motion(2): " + ex);
    }
    
    return ret;
}

/* Detect Motion Detail */
function _detectMotionDetail2(prevFrame,frame){
    var ret = { prevFrame: frame, frame: frame, baseFrame: frame, hasMotion: false, ptStatus: {} };
    const tmpColor = new cv.Vec(0, 0, 255), motionDelta = 1500;

    try {
        ret.ptStatus = { 
            x: { low: null, high: null},
            y: { low: null, high:null }
        }

        ret.prevFrame = frame.copy();
        ret.baseFrame = frame.copy();
        var gray = frame.copy();

        //convert to grayscale
        prevFrame.bgrToGray();
        prevFrame.blur(new cv.Size(21, 21));

        gray.bgrToGray();
        gray.blur(new cv.Size(21, 21));

        //compute difference between first frame and current frame
        var frameDelta = prevFrame.absdiff(gray);
        var thresh = frameDelta.threshold(25,255, cv.THRESH_BINARY);
        thresh.dilate(
            cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
            new cv.Point(-1, -1), 2);
                
        // Get Difference Count        
        thresh = thresh.bgrToGray();
        let contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        var motionContour = contours.filter(function(item){ return item.area > motionDelta; });
        var contourPts = contours.map((contour) => { return contour.getPoints(); });

        ret.hasMotion = motionContour.length > 0;
        ret.frame.drawContours(contourPts, -1, tmpColor, { thickness: 1 });
        //ret.frame = _drawMotionConstraints(ret.frame, contourPts);
        
        //console.log(" -> [Motion XY]: "); contourPts.forEach(function(pt){ console.log("PT: ", pt.map(function(item){ return "X:"+ item.x + " |Y: " + item.y; })); });
        //console.log(" -> [Motion P]: "); console.log(contourPts);   
        console.log(" -> [Motion P]: "); console.log(contours);  
    }
    catch(ex){
        console.log("Detection Motion(2): " + ex);
    }
    
    return ret;
}

function _drawMotionConstraints(frame, contourPts){
    var ret = frame, linePercent = .10, tmpColor = new cv.Vec(0, 0, 255)

    try {
        contourPts.forEach(function(section){
            // Get Motion Area
            var ptStatus = { x: { low: -1, high: -1}, y: { low: -1, high:-1 } };
            section.forEach(function(pt){ 
                if(ptStatus.x.low == -1 || pt.x < ptStatus.x.low) { ptStatus.x.low = pt.x; }
                if(ptStatus.x.high == -1 || pt.x > ptStatus.x.high) { ptStatus.x.high = pt.x; }

                if(ptStatus.y.low == -1 || pt.y < ptStatus.y.low) { ptStatus.y.low = pt.y; }
                if(ptStatus.y.high == -1 || pt.y > ptStatus.y.high) { ptStatus.y.high = pt.y; }
            }); 

            // Get Area Center
            var ctr = new cv.Point((ptStatus.x.high + ptStatus.x.low)/2, (ptStatus.y.high + ptStatus.y.low)/2);

            // Get Line Length
            var lineLength = {
                x: (ptStatus.x.high + ptStatus.x.low) * linePercent, 
                y: (ptStatus.y.high + ptStatus.y.low) * linePercent
            };           

            // Pt1
            const pt1 = new cv.Point(ptStatus.x.low, ptStatus.y.low);
            ret.drawLine(pt1, new cv.Point(ptStatus.x.low + lineLength.x, ptStatus.y.low), tmpColor, 2, cv.LINE_8);
            ret.drawLine(pt1, new cv.Point(ptStatus.x.low, ptStatus.y.low + lineLength.y), tmpColor, 2, cv.LINE_8);

            // Pt2            
            const pt2 = new cv.Point(ptStatus.x.high, ptStatus.y.low);
            ret.drawLine(pt2, new cv.Point(ptStatus.x.high - lineLength.x, ptStatus.y.low), tmpColor, 2, cv.LINE_8);
            ret.drawLine(pt2, new cv.Point(ptStatus.x.high, ptStatus.y.low + lineLength.y), tmpColor, 2, cv.LINE_8);
            
            // Pt3
            const pt3 = new cv.Point(ptStatus.x.high, ptStatus.y.high);
            ret.drawLine(pt3, new cv.Point(ptStatus.x.high - lineLength.x, ptStatus.y.high), tmpColor, 2, cv.LINE_8);
            ret.drawLine(pt3, new cv.Point(ptStatus.x.high, ptStatus.y.high - lineLength.y), tmpColor, 2, cv.LINE_8);

            // Pt4
            const pt4 = new cv.Point(ptStatus.x.low, ptStatus.y.high);
            ret.drawLine(pt4, new cv.Point(ptStatus.x.low + lineLength.x, ptStatus.y.high), tmpColor, 2, cv.LINE_8);
            ret.drawLine(pt4, new cv.Point(ptStatus.x.low, ptStatus.y.high - lineLength.y), tmpColor, 2, cv.LINE_8);

            // Center
            ret.drawCircle(ctr, 1, tmpColor, 1, cv.LINE_8);
        });
    }
    catch(ex){
        console.log("[Error] Drawing Motion Constraints: ",ex);
    }

    return ret;
}

/* Motion Stats */
function _motionStats(dataList){
    var ret = {min: null, max: null, center:{ y: 0, x:0 }};
    try {
        for(var i=0; i < dataList.length; i++){
            // Min
            if(ret.min == null || dataList[i].x < ret.min.x || dataList[i].y < ret.min.y) { 
                ret.min = dataList[i];
            }

            // Max
            if(ret.max == null || dataList[i].x > ret.max.x || dataList[i].y > ret.max.y) { 
                ret.max = dataList[i];
            }

            ret.center.x += dataList[i].x;
            ret.center.y += dataList[i].y;
        }

        ret.center.x = Math.ceil(ret.center.x / dataList.length);
        ret.center.y = Math.ceil(ret.center.y / dataList.length);
    }
    catch(ex){
        jtools.errorLog(" [ERROR] generating motion stats: " + ex);
    }

    return ret;
}

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
        jtools.errorLog(" [ERROR] getting special Index: " + ex);
    }
    return -1;
}
/* Decoder for Text Detection */
function _decode(scores, geometry, MIN_CONFIDENCE) {
    const [numRows, numCols] = scores.sizes.slice(2);
    const boxes = [];
    const confidences = [];
  
    for (let y = 0; y < numRows; y += 1) {
      for (let x = 0; x < numCols; x += 1) {
        const score = scores.at([0, 0, y, x]);
  
        if (score < MIN_CONFIDENCE) {
          continue;
        }
  
        const offsetX = x * 4;
        const offsetY = y * 4;
        const angle = geometry.at([0, 4, y, x]);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
  
        const h = geometry.at([0, 0, y, x]) + geometry.at([0, 2, y, x]);
        const w = geometry.at([0, 1, y, x]) + geometry.at([0, 3, y, x]);
  
        const endX = offsetX + (cos * geometry.at([0, 1, y, x])) + (sin * geometry.at([0, 2, y, x]));
        const endY = offsetY - (sin * geometry.at([0, 1, y, x])) + (cos * geometry.at([0, 2, y, x]));
        const startX = endX - w;
        const startY = endY - h;
  
        boxes.push(new cv.Rect(startX, startY, endX - startX, endY - startY));
        confidences.push(score);
      }
    }
  
    return [boxes, confidences];
}
/* Load Text Detection Model */
function _loadTextDetection(textDetectModel){
    var ret;
    try {
        ret = cv.readNetFromTensorflow(textDetectModel);
    }
    catch(ex){
        jtools.errorLog(" [ERROR] Loading Text Detection Model: " + ex);
    }
    return ret;
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
        jtools.errorLog(" [ERROR] Loading Face Mark: " + ex);
    }

    return facemark;
}

/* Size Mat to fit screen */
function _sizeImg(img){
    var retImg;
    
    try {
        const mainScreen = { "width":1032 }; /*screen.main();*/
        retImg = (mainScreen.width < img.cols ? _sizeImg(img.rescale(.7)): img);
    }
    catch(ex){
        jtools.errorLog(" [ERROR] resizing image: " + ex);
        retImg = img;
    }
    return retImg;
} 
/* Get Image Info */
function _getImgInfo(imgId, imgIndex){
    var ret = "--";
    try {
        if(Object.keys(imgIndex).length > 0) {
            var imgObj = (imgId in imgIndex ? imgIndex[imgId] : null);
            
            if(imgObj == null){
                ret = "[Invalid ID]";
            }
            else {
                ret = imgObj.firstname + " " + imgObj.lastname;
            }
        }
        else {
            ret = "NA [C003]";
        }
    }
    catch(ex){
        jtools.errorLog(" [ERROR] getting Img Info: " + ex);
    }

    return ret;
}
/* Build Name Map */
function _buildNameMap(photoMemory){
    var nameObj = {};
    try {       
        const mapImgName = (folder) => {
            var name = folder.folderNm;

            if(!(name in nameObj)){ nameObj[name] = 1; }
            else { nameObj[name] = nameObj[name] +1; }
        };

        const imgFolders = fs.readdirSync(photoMemory).filter(function(item){ 
            return item != "_noFace" && fs.lstatSync(photoMemory+"/"+item).isDirectory(); 
        }).map(function(folder){
            return { "path": photoMemory+ "/"+ folder, "folderNm": folder };
        });

        imgFolders.map(mapImgName);
    }
    catch(ex){
        jtools.errorLog(" [ERROR] building name map: " + ex);
    }
    return nameObj;
}

/* Load Recog Training Data 2 */
function _loadRecogTrainingData(photoMemory, imgIndex, nameMappings, imgResize, facialClassifier, imgIndexModel){
    var ret = { "face":false, "lbph": new cv.LBPHFaceRecognizer(), "eigenRecognizer":new cv.EigenFaceRecognizer(), "fisherRecognizer": new cv.FisherFaceRecognizer()  };
    
    const lbphFile = photoMemory + "/_photoModels/lbph.yml",
          eigenFile = photoMemory + "/_photoModels/eigen.yml",
          fisherFile = photoMemory + "/_photoModels/fisher.yml";
    
    try {
        // Load Name Map
        console.log(" > Loading Name Map");
        nameMappings.map = ((Object.keys(nameMappings.map).length === 0) ? _buildNameMap(photoMemory) : nameMappings.map);        
        nameMappings.list = Object.keys(nameMappings.map);

        // Load Img Index 
        imgIndex.data = (fs.existsSync(imgIndexModel) ? require(imgIndexModel) : {});

        // Load File Folders
        console.log(" > Loading File Folders");
        var noRead = {"_noFace": 1, "_photoModels":1 };
        const imgFolders = fs.readdirSync(photoMemory).filter(function(item){ 
            return !(item in noRead) && fs.lstatSync(photoMemory+"/"+item).isDirectory(); 
        }).map(function(folder){
            return { "path": photoMemory+ "/"+ folder, "folderNm": folder, "files": fs.readdirSync(photoMemory+ "/"+ folder) };
        });

        // Get Face Images
        const getFaceImage = (grayImg) => {
            const faceRects = facialClassifier.detectMultiScale(grayImg).objects;
             if (!faceRects.length) {
               throw new Error('failed to detect faces');
             }
             return grayImg.getRegion(faceRects[0]);
         };

         if(!fs.existsSync(eigenFile) || !fs.existsSync(lbphFile) || !fs.existsSync(fisherFile)) {
            console.log(" > Processing Face Imgs");
            var validFaceImgs = [];
            imgFolders.forEach(function (folder){
                folder.files.forEach(function(file){
                    var tmp1 = path.resolve(folder.path, file);                
                    var tmp2 = cv.imread(tmp1);
                    var tmp3 = tmp2.bgrToGray();
                    const faceRects = facialClassifier.detectMultiScale(tmp3).objects;

                    if (!faceRects.length) {
                        jtools.errorLog(" [Warning] No Face File: "+ tmp1);
                        // move file
                        fs.copyFile(tmp1, path.resolve(photoMemory, "_noFace", file), function(err){
                            fs.unlink(tmp1, function(err){
                                if (err) throw err;
                                jtools.errorLog(" [Warning] Removed IMG: "+ tmp1);
                            });
                        });
                    }
                    else {
                        validFaceImgs.push({ "name": folder.folderNm, "img": tmp1 });
                    }
                });
            });

            console.log(" > Processing Training Imgs");
            const trainImgs = validFaceImgs
                // read image
                .map(filePath => cv.imread(filePath.img))
                // face recognizer works with gray scale images
                .map(img => img.bgrToGray())
                // detect and extract face
                .map(getFaceImage)
                // face images must be equally sized
                .map(faceImg => faceImg.resize(imgResize, imgResize));

            const labels = validFaceImgs.map(function(faceImg){
                return nameMappings.list.indexOf(faceImg.name);
            });
            
            console.log(" > Training Models");
            if(labels.length > 0 && labels.length == trainImgs.length) {
                // LBPH
                ret.lbph.train(trainImgs, labels);
                ret.lbph.save(lbphFile);

                //EIGEN
                ret.eigenRecognizer.train(trainImgs, labels); 
                ret.eigenRecognizer.save(eigenFile);

               // FISHER
                ret.fisherRecognizer.train(trainImgs, labels); 
                ret.fisherRecognizer.save(fisherFile);                
            }
        }
        else {
            console.log(" > Training Models");
            ret.lbph.load(lbphFile);
            ret.eigenRecognizer.load(eigenFile);
            ret.fisherRecognizer.load(fisherFile);
        }       
                
        ret.face = true;
        console.log(" > Completed Training");            
    }
    catch(ex){
        jtools.errorLog(" [ERROR] Loading Training Recog Data: " + ex);
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
        jtools.errorLog(" [ERROR] drawing polyline: " + ex);
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
        jtools.errorLog(" [ERROR] Drawing Landmark: " + ex);
    }
}

/* Process Recognition Images */
function _processRecognitionImgs(baseLoc, finalLoc, facialClassifier){
    var resizeMax = 80;
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
                jtools.errorLog(" [WARNING] Couldn't process: " + imgFiles[i]);
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
        jtools.errorLog(" [ERROR] processing Recognition Images: " + ex);
    }

    return "completed";
}
