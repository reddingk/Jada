'use strict';
/*
 * JADA TOOLS LIBRARY CLASS
 * By: Kris Redding
 */

class TOOLS {  
    constructor() {}
    
    stringFormat(str, args) {
        var content = str;
        for (var i=0; i < args.length; i++){
            var replacement = '{' + i + '}';
            content = content.replace(replacement, args[i]);
        }
        return content;
    }

    emptyCheck(val) {
        return(val == undefined || val == '' || val == null);
    }
}

module.exports = TOOLS;