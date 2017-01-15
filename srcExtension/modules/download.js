/** **************** DownloadSession Class ******************** */
var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://imagepicker/common.js");
Cu.import("resource://imagepicker/sequence.js");
Cu.import("resource://imagepicker/settings.js");
Cu.import("resource://imagepicker/fileUtils.js");
Cu.import("resource://gre/modules/PopupNotifications.jsm");

/**
 * DownloadSession class is used to download multiple files
 *
 * @namespace ImagePicker
 * @class ImagePicker.DownloadSession
 * @constructor
 */
ImagePicker.DownloadSession = function(images, destDir, privacyInfo,
    newDownloadProgressListener, savedListeners, stringsBundle) {

    this.images = images;
    this.destDir = destDir;
    this.privacyContext = privacyInfo.privacyContext;
    this.inPrivateBrowsingMode = privacyInfo.inPrivateBrowsing;

    this.newDownloadProgressListener = newDownloadProgressListener;
    this.savedListeners = savedListeners;
    this.stringsBundle = stringsBundle;

    this.ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    this.mimeService = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

    ImagePicker.Logger.info("Created DownloadSession[images=" + this.images.length + ", destDir=" + this.destDir.path
            + ", inPrivateBrowsingMode=" + this.inPrivateBrowsingMode + "]");
};

ImagePicker.DownloadSession.prototype = {

    /**
     * save images to local
     *
     * @method saveImages
     */
    saveImages : function() {

        var images = this.images;

        this._preSaveImages(this.destDir, images, this.savedListeners);

        // Handle each file
        var fileNames = new Array();
        for (var i = 0; i < images.length; i++) {
            var img = images[i];
            
            var file = img.outputFile;
            if(!file){
                var hasExt = (img.fileExt != null && img.fileExt.trim().length > 0);
                var fileExt = (hasExt? img.fileExt : "jpg");
                file = ImagePicker.FileUtils.createUniqueFile(img.fileName, fileExt, this.destDir, fileNames);
            }

            try {
                this._saveImageToFile(img.url, file);
            } catch (ex) {
                ImagePicker.Logger.error("Cannot save image: " + img, ex);
            }
        }
        this._postSaveImages(this.destDir, images, this.savedListeners, this.stringsBundle);
    },

    _preSaveImages : function(savedFolder, images, savedListeners) {
        if (savedListeners) {
            savedListeners.forEach(function(listener) {
                ImagePicker.Logger.debug("Invoke PreSavedListener: " + listener);
                if (listener) {
                    try {
                        listener.preSavedImages(savedFolder, images);
                    } catch (ex) {
                        ImagePicker.Logger.error("Occured Error " + ex + " when execute PreSaveImage Listener: "
                                + listener);
                    }
                }
            });
        }
    },

    _postSaveImages : function(savedFolder, images, savedListeners, stringsBundle) {

        if (savedListeners) {
            savedListeners.forEach(function(listener) {
                ImagePicker.Logger.debug("Invoke PostSavedListener: " + listener);
                if (listener) {
                    try {
                        listener.afterSavedImages(savedFolder, images);
                    } catch (ex) {
                        ImagePicker.Logger.error("Occured Error " + ex + " when execute PostSaveImage Listener: "
                                + listener);
                    }
                }
            });
        }
    },

    /**
     * Chunk array
     */
    _chunk : function (arr, len) {

        var chunks = [], i = 0, n = arr.length;

        while (i < n) {
            chunks.push(arr.slice(i, i += len));
        }

        return chunks;
    },


    /**
     * save image to local
     *
     * @method _saveImageToFile
     */
    _saveImageToFile : function(fromURL, toFile) {

        // Create URI from which we want to download file
        var fromURI = this.ioService.newURI(fromURL, null, null);

        // create cacheKey
        var cacheKey = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
        cacheKey.data = fromURL;

        // Set to where we want to save downloaded file
        var toURI = this.ioService.newFileURI(toFile);

        // Set up correct MIME type
        var mime;
        try {
            var type = this.mimeService.getTypeFromURI(fromURI);
            mime = this.mimeService.getFromTypeAndExtension(type, "");
        } catch (e) {
            ImagePicker.Logger.info("cannot get mine type, e = " + e);
        }

        // Observer for download
        var nsIWBP = Ci.nsIWebBrowserPersist;
        var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(nsIWBP);
        persist.persistFlags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES | nsIWBP.PERSIST_FLAGS_FROM_CACHE
                | nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
        persist.progressListener = this.newDownloadProgressListener;

        persist.saveURI(fromURI, cacheKey, null, null, null, null, toURI, this.privacyContext);
    }
};
