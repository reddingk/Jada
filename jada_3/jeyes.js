'use strict';
/*
 * JADA EYES CLASS
 * By: Kris Redding
 */
const cv = require("opencv4nodejs");
const fs = require("fs");
const log = require('../server/services/log.service');

const configLoc = (process.env.CONFIG_LOC ? process.env.CONFIG_LOC : "/jada/localConfig");

class JEYES {
    constructor(){
        /* Const Variables */
        this.imgResize = 80;
        this.imgIndex = { "data":{}};
        this.nameMappings = {"map":{},"list":[]};
        this.recogList = [
            {"name":"lbph", "minDetections": 100 },
            {"name":"eigenRecognizer", "minDetections": 2000 },
            {"name":"fisherRecognizer", "minDetections": 320 },
        ];

        /* Style Variables */
        this.foundColor = new cv.Vec(102,51,0);
        this.baseColor = new cv.Vec(4,205,252);

        /* File Declerations */
        this.photoMemory = configLoc + "/config/data/photoMemory";
        this.imgIndexModel = configLoc + "/config/data/imgIndex.json";
        this.facemarkModel = configLoc+"/config/data/lbfmodel.yaml";
        this.modelLibrary =  require(configLoc+"/config/data/modellib.json");
        this.facialClassifier = new cv.CascadeClassifier(configLoc+"/config/data/visionary_cascade.xml");

        this.recogData = _loadRecogTrainingData(this.photoMemory, this.imgIndex, this.nameMappings, this.imgResize, this.facialClassifier, this.imgIndexModel);  
        this.markData = _loadFacemark(this.facemarkModel);
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
            log.error("converting base 64 to mat: " + ex);
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
            log.error("converting mat to base 64: " + ex);
            return null;
        }
    }

    /* Facial Recognize MAT */
    faceRecogImg(recogImg){
        var self = this, ret = {"img":null, "names":[], "error":null};

        try {  
            recogImg = recogImg.resizeToMax(640);
            const result = self.facialClassifier.detectMultiScale(recogImg.bgrToGray());             
            result.objects.forEach((faceRect, i) => {  
                const faceImg = recogImg.getRegion(faceRect).bgrToGray().resize(self.imgResize, self.imgResize);
                
                var predictionMap = {}, who = null, tmpWho = null, displayColor = self.foundColor;

                for(var j =0; j < self.recogList.length; j++){
                    tmpWho = null;
                    var tmpPrediction = self.recogData[self.recogList[j].name].predict(faceImg);  
                    
                    if(Math.round(tmpPrediction.confidence) >= self.recogList[j].minDetections){
                        tmpWho = _getImgInfo(self.nameMappings.list[tmpPrediction.label], self.imgIndex.data);
                        predictionMap[tmpWho] = (tmpWho in predictionMap ? predictionMap[tmpWho] + 1 : 1);
                    }
    
                    if(tmpWho && predictionMap[tmpWho] > 1){ who = tmpWho; break; }
                }

                
                displayColor = (who ? self.baseColor: self.foundColor);
                
                if(who){ ret.names.push(who); }
                var rect = cv.drawDetection(recogImg, faceRect, { color: displayColor, segmentFraction: 4 });

                cv.drawTextBox(recogImg,
                    new cv.Point(rect.x, rect.y + rect.height + 10),
                    [{ text: (who ? who : "not sure?"), fontSize: 0.6 }], 0.4);
            });
            
            ret.img = recogImg;
        }
        catch(ex){
            log.error("Recognizing Imgs: " + ex); ret.error = ex;
        }
        
        return ret;
    }

    /* Face Mark MAT */
    facemarkImg(img, resize){
        var self = this, ret = {"img":null, "total":0, "error":null};
        
        var faceClassifierOpts = {
            minSize: new cv.Size(30, 30),
            scaleFactor: 1.126, minNeighbors: 1,
        }

        try {
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
            log.error(" [ERROR] facemarking image: " + ex); ret.error = ex;
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
            log.error("edge detecting image: " + ex); ret.error = ex;
        }

        return ret;
    }

    /* modelMap Img */
    modelMapImg(img, searchFilter, filter){
        var self = this, ret = {"img":null, "layers":[], "error":null};

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
                
                const size = new cv.Size(416, 416), vec3 = new cv.Vec(0, 0, 0);
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

                            const centerX = parseInt(box[0] * imgWidth), centerY = parseInt(box[1] * imgHeight);
                            const width = parseInt(box[2] * imgWidth), height = parseInt(box[3] * imgHeight);

                            const x = parseInt(centerX - width / 2), y = parseInt(centerY - height / 2);

                            boxes.push(new cv.Rect(x, y, width, height));
                            confidences.push(confidence); classIDs.push(classId);

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
            log.error("library mapping image: " + ex); ret.error = ex;
        }

        return ret;
    }

    /* Process Recognition Img */
    processRecognitionImgs(sourcePath, destinationPath, callback){
        var self = this, ret = { "error":"", "processedImgs":0, "unprocessedImgs":0 }, resizeMax = 650;

        try {
            // Read In file Location
            const imgFiles = fs.readdirSync(sourcePath);

            // Process All Imgs
            for(var i =0; i < imgFiles.length; i++){
                var filePath = path.resolve(sourcePath, imgFiles[i]);
                var imgMat = _sizeImg(cv.imread(filePath));
                var grayImg = imgMat.bgrToGray();

                log.info("File " + i + ":" + filePath);
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
            log.error("Processing Recognizing Imgs: " + ex);
            ret.error = ex;
        }
        callback(ret);
    }
}

module.exports = JEYES;

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
        log.error("building name map: " + ex);
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
        log.info(" > Loading Name Map");
        nameMappings.map = ((Object.keys(nameMappings.map).length === 0) ? _buildNameMap(photoMemory) : nameMappings.map);        
        nameMappings.list = Object.keys(nameMappings.map);

        // Load Img Index 
        imgIndex.data = (fs.existsSync(imgIndexModel) ? require(imgIndexModel) : {});

        // Load File Folders
        log.info(" > Loading File Folders");
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
            log.info(" > Processing Face Imgs");
            var validFaceImgs = [];
            imgFolders.forEach(function (folder){
                folder.files.forEach(function(file){
                    var tmp1 = path.resolve(folder.path, file);                
                    var tmp2 = cv.imread(tmp1);
                    var tmp3 = tmp2.bgrToGray();
                    const faceRects = facialClassifier.detectMultiScale(tmp3).objects;

                    if (!faceRects.length) {
                        log.warning("No Face File: "+ tmp1);
                        // move file
                        fs.copyFile(tmp1, path.resolve(photoMemory, "_noFace", file), function(err){
                            fs.unlink(tmp1, function(err){
                                if (err) throw err;
                                log.warning("Removed IMG: "+ tmp1);
                            });
                        });
                    }
                    else {
                        validFaceImgs.push({ "name": folder.folderNm, "img": tmp1 });
                    }
                });
            });

            log.info(" > Processing Training Imgs");
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
            
            log.info(" > Training Models");
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
            log.info(" > Training Models");
            ret.lbph.load(lbphFile);
            ret.eigenRecognizer.load(eigenFile);
            ret.fisherRecognizer.load(fisherFile);
        }       
                
        ret.face = true;
        log.info(" > Completed Training");            
    }
    catch(ex){
        log.error(" Loading Training Recog Data: " + ex);
    }

    return ret;
}

/* Load Face Mark */
function _loadFacemark(facemarkModel){
    var facemark = null;
    
    try {
        facemark = new cv.FacemarkLBF();
        // create the facemark object with the landmarks model            
        facemark.loadModel(facemarkModel);
    }
    catch(ex){
        log.error("Loading Face Mark: " + ex);
    }

    return facemark;
}

/* Get Image Info */
function _getImgInfo(imgId, imgIndex){
    var ret = "--";
    try {
        if(Object.keys(imgIndex).length > 0) {
            var imgObj = (imgId in imgIndex ? imgIndex[imgId] : null);
            
            if(imgObj == null){ ret = "[Invalid ID]"; }
            else { ret = imgObj.firstname + " " + imgObj.lastname; }
        }
        else {
            ret = "NA [C003]";
        }
    }
    catch(ex){
        log.error("getting Img Info: " + ex);
    }

    return ret;
}

/* Size Mat to fit screen */
function _sizeImg(img){
    var retImg;
    
    try {
        const mainScreen = { "width":1032 };
        retImg = (mainScreen.width < img.cols ? _sizeImg(img.rescale(.7)): img);
    }
    catch(ex){
        log.error(" resizing image: " + ex); retImg = img;
    }
    return retImg;
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
        log.error(" [ERROR] drawing polyline: " + ex);
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
        log.error("Drawing Landmark: " + ex);
    }
}