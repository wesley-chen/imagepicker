/** **************** FileUtils Object Class ******************** */
var EXPORTED_SYMBOLS = [];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://imagepicker/common.js");
Cu.import("resource://imagepicker/settings.js");

/**
 * Provides the file utilities and extensions used by the ImagePicker
 *
 * @namespace ImagePicker
 * @class ImagePicker.FileUtils
 */
ImagePicker.FileUtils = {

    /**
     * Attempt to open the given nsIFile directory with Finder/Explorer/Whatever properties.
     *
     * @method revealDirectory
     * @param {nsIFile}
     *            directory The directory to open.
     */
    revealDirectory : function(directory) {
        var osString = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;

        // OS X Finder shows the folder containing the reveal
        // target. What we really want is to show the
        // contents of the target folder.
        if ((osString == "Darwin") && directory.isDirectory()) {
            var files = directory.directoryEntries;
            if (files.hasMoreElements()) {
                directory = files.getNext().QueryInterface(Ci.nsIFile);
            }
        }

        // Reveal is not implemented on all platforms.
        try {
            directory.reveal();
        } catch (e) {
            ImagePicker.Logger.error("Cannot open directory for " + directory, e);
        }
    },

    /**
     * Convert the path to nsILocalFile object. Attempt to create a directory for the given path if it is a nonexistent
     * directory.
     *
     * @method toDirectory
     * @param {String}
     *            path The path of directory to open.
     * @return {nsILocalFile} the nsILocalFile representing the directory for the given path
     */
    toDirectory : function(path) {

        // check argument
        if ((path == null) || (path.length == 0)) {
            return null;
        }

        // create directory
        var directory = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

        try {
            directory.initWithPath(path);
            if (!directory.exists()) {
                directory.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
            }

            return directory;
        } catch (e) {
            ImagePicker.Logger.warn("Cannot convert path: " + path + " to directory. ", e);
            return null;
        }

        return null;
    },

    /**
     * Attempt to convert the given originalName to a valid directory/file name
     *
     * @method toValidName
     * @param {String}
     *            originalName the original name to be converted.
     * @return {String} a valid directory/file name for the given originalName
     */
    toValidName : function(originalName) {

        var validName = originalName;

        // replace special char: [,\,/,:,*,.,?,",<,>,|,]
        var reg = new RegExp("[\\\/:\*?\"<>|]", "g");

        validName = validName.replace(reg, "");

        validName = validName.substr(0, 100);

        // trim
        validName = validName.replace(/^\s*/, "").replace(/\s*$/, "");

        if (originalName.length != validName.length) {
            ImagePicker.Logger.info("convert " + originalName + " to valid directory/file name: " + validName);
        }

        return validName;
    },

    /**
     * Attempt to create a unique file for the given fileName in the given parentDir. If the parentDir and fileNames
     * contains the same file or fileName, the method will make a new unique file name.
     *
     * @method getUniqueFile
     * @param {String}
     *            fileName the name of file to be created.
     * @param {nsILocalFile}
     *            parentDir the parent directory to create file.
     * @param {Array
     *            <String,boolean>} fileNames the Array contains all file names which will be created in parentDir.
     * @return {nsILocalFile} the nsILocalFile representing the unique file for the given file name
     */
    createUniqueFile : function(fileName, parentDir, fileNames) {

        var originalName = this.toValidName(fileName);

        var tempName = originalName;

        // create a temp file for the file name
        var tempFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
        tempFile.initWithFile(parentDir);
        tempFile.append(tempName);

        // check if the file is exists.
        var incNumber = 1;
        while (tempFile.exists() || (typeof (fileNames[tempName]) != 'undefined')) {
            // if the file exists or have a exist name in array, make a new file
            // name
            if (originalName.indexOf('.') != -1) { // have file ext
                var ext = originalName.substring(originalName.lastIndexOf('.'), originalName.length);
                var fileNameWithoutExt = originalName.substring(0, originalName.length - ext.length);
                tempName = fileNameWithoutExt + "(" + incNumber + ")" + ext;
            } else {
                tempName = originalName + "(" + incNumber + ")";
            }

            // init file with new name
            tempFile.initWithFile(parentDir);
            tempFile.append(tempName);
            incNumber++;
        }

        // put file name as key to fileNames array
        fileNames[tempName] = true;

        return tempFile;
    },

    createFolder : function(parentDirPath, subFolderName) {

        // clone the parent folder, don't use the clone() method.
        var subFolder = this.toDirectory(parentDirPath);

        // create new folder with window title
        try {
            subFolder.append(subFolderName);
            if (!subFolder.exists() || !subFolder.isDirectory()) {
                // if it doesn't exist, create
                subFolder.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
            }
            return subFolder;
        } catch (e) {
            ImagePicker.Logger.warn("Cannot create subfolder: " + e);
        }

        return null;
    },

    makeFolderNameByTitle : function(docTitle) {
        var subFolderName = docTitle;

        // remove unnecessary text
        var textLines = ImagePicker.Settings.getRemoveTextFromTitle();
        for ( var i = 0; i < textLines.length; i++) {
            var reg = new RegExp(textLines[i], "gi");
            subFolderName = subFolderName.replace(reg, '');
        }

        subFolderName = subFolderName.replace(/\./g, '');

        return this.toValidName(subFolderName);
    }
};