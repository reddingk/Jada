'use strict';
const fs = require('fs');
const pathCmd = require("path");

var struct = { name: null, type: null, size: 0, slicesize:0, data: [], slice: 0 };

class JFileStore {
    constructor() {        
       this.files = {};
       this.activeFiles = []; 
       this.storeSz = 12;  
    }

    // Stream File Data
    streamFileData(data, stream, callback){
        var self = this;
        try {
            if(!data.error && data.data) {
                var filename = 'filestore/'+ data.sID +"_"+ data.data.name;
                var filepath = pathCmd.resolve(__dirname, '../../public/' + filename);
                
                stream.pipe(fs.createWriteStream(filepath)); 
                stream.on('end', function () {
                    if(self.activeFiles.indexOf(filepath) < 0){
                        self.activeFiles.push(filepath);
                    }
                    self.cleanStore("");
                    callback({ path: filepath, filename: filename});
                });
            }
        }
        catch(ex){
            console.log(" [Error] streaming file data: ",ex);
        }
    }

    // Clean Store
    cleanStore(type){
        try {
            var removeSz = (type === "all" ? 0 : this.storeSz);
            
            while(this.activeFiles.length > removeSz) {
                var clearFile = this.activeFiles.shift();
                fs.unlinkSync(clearFile);
            }            
        }
        catch(ex){
            console.log(" [Error] cleaning file store: ",ex);
        }
    }
}

module.exports = JFileStore;