/** **************** ImageInfo Object Class ******************** */
Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/model.js");


/** **************** ImageUtils Object Class ******************** */

/**
 * Provides the image utilities and extensions used by the ImagePicker
 *
 * @namespace ImagePicker
 * @class ImagePickerChrome.ImageUtils
 */
ImagePickerChrome.ImageUtils = {
    
    /**
     * Attempt to update file size from cache. If cache is un-avalidable, attempt
     * to update file size by cache listener.
     *
     * @method updateFileSizeFromCache
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    updateFileSizeFromCache: function(imageInfo){
    
        ImagePickerChrome.ImageUtils.updateFileSizeFromSyncCache(imageInfo);
        
        if (imageInfo.fileSize <= 0) {
            ImagePickerChrome.ImageUtils.updateFileSizeFromAsyncCache(imageInfo);
        }
    },
    
    /**
     * Attempt to update file size from cache.
     *
     * @method updateFileSizeFromCache
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    updateFileSizeFromSyncCache: function(imageInfo){
    
        var url = imageInfo.url;
        var cacheKey = url.replace(/#.*$/, "");
        
        var fileSize = null;
        try {
            // try to get from http cache, return nsICacheEntryDescriptor            
            var descriptor = ImagePickerChrome.httpCacheSession.openCacheEntry(cacheKey, Ci.nsICache.ACCESS_READ, false);
            if (descriptor) {
                fileSize = descriptor.dataSize;
                descriptor.close();
            }
        } catch (ex) {
            if (ex.result == 0x804B003D) {
                //NS_ERROR_CACHE_KEY_NOT_FOUND (0x804B003D): Thrown when the url contents are not in the cache.
                ImagePicker.Logger.debug("Error: NS_ERROR_CACHE_KEY_NOT_FOUND, cacheKey=" + cacheKey + ", " + imageInfo);
                imageInfo.isCached = false;
            } else if (ex.result == 0x804b0040) {
                //NS_ERROR_CACHE_WAIT_FOR_VALIDATION (0x804B0040): Thrown when the url contents are in the cache, but not yet marked valid.
                ImagePicker.Logger.debug("Error: NS_ERROR_CACHE_WAIT_FOR_VALIDATION, " + imageInfo);
            } else {
                ImagePicker.Logger.warn("Cannot update file size by sync cache for " + imageInfo, ex);
            }
        }
        
        if (fileSize > 0) {
            imageInfo.loadFileSizeFromCacheCompleted = true;
            imageInfo.setFileSize(fileSize);
            ImagePicker.Logger.info("update file size to " + fileSize + " from sync cache for " + imageInfo);
        }
    },
    
    /**
     * Try to update file size by cache listener.
     *
     * @method updateFileSizeFromCache
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    updateFileSizeFromAsyncCache: function(imageInfo){
    
        var url = imageInfo.url;
        var cacheKey = url.replace(/#.*$/, "");
        
        ImagePicker.Logger.info(" try to update file size by async cache for " + imageInfo);
        
        // try to update file size by cache listener
        var listener = new ImagePickerChrome.CacheListener(imageInfo);
        try {
            ImagePickerChrome.httpCacheSession.asyncOpenCacheEntry(cacheKey, Ci.nsICache.ACCESS_READ, listener);
        } catch (ecache) {
            ImagePicker.Logger.warn("Cannot update file size by async Cache for " + imageInfo, ecache);
        }
    },
    
    /**
     * Attempt to update file name from cache.
     *
     * @method updateFileNameFromCache
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    updateFileNameFromCache: function(imageInfo){
    
        var imgICache = Ci.imgICache;
        var nsISupportsCString = Ci.nsISupportsCString;
        
        var aURL = imageInfo.url;
        var aDocument = window.document;
        var charset = aDocument.characterSet;
        var contentType = null;
        var contentDisposition = null;
        try {
            var imageCache = Cc["@mozilla.org/image/cache;1"].getService(imgICache);
            var props = imageCache.findEntryProperties(makeURI(aURL, charset));
            
            ImagePicker.Logger.debug("find content props = " + props + " for " + imageInfo);
            if (props) {
                if (props.has("content-disposition")) {
                    contentDisposition = props.get("content-disposition", nsISupportsCString);
                }
                if (props.has("type")) {
                    contentType = props.get("type", nsISupportsCString);
                    if (contentType) {
                        var msrv = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);
                        var mime = msrv.getFromTypeAndExtension(contentType, "");
                        if(mime != null && !mime.extensionExists(imageInfo.fileExt)){
                            imageInfo.setFileExt(mime.primaryExtension);
                            ImagePicker.Logger.info("update file ext to " + mime.primaryExtension + " from content-type for " + imageInfo);
                        }
                   }
                }
                ImagePicker.Logger.debug("contentDisposition = " + contentDisposition + ", contentType = " + contentType + " for " + imageInfo);
            }
        } catch (e) {
            //Ignore
            ImagePicker.Logger.warn("Failure to get type and content-disposition of the image " + imageInfo, e);
        }
        
        // look for a filename in the content-disposition header, if any
        if (contentDisposition) {
            var mhpContractID = "@mozilla.org/network/mime-hdrparam;1";
            var mhpIID = Ci.nsIMIMEHeaderParam;
            var mhp = Cc[mhpContractID].getService(mhpIID);
            var dummy = {
                value: null
            }; // Need an out param...
            var fileName = null;
            try {
                fileName = mhp.getParameter(contentDisposition, "filename", charset, true, dummy);
                
            } catch (e) {
                try {
                    fileName = mhp.getParameter(contentDisposition, "name", charset, true, dummy);
                } catch (e) {
                }
            }
            
            if (fileName != null) {
                imageInfo.setFileName(fileName);
                
                ImagePicker.Logger.info("update file name to " + fileName + " from content-disposition for " + imageInfo);
            }
        }
    },
    
    /**
     * Attempt to update file ext from MIME service.
     *
     * @method updateFileExtensionByMIME
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    updateFileExtensionByMIME: function(imageInfo){
       
        try {
            // Create URI for image
            var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
            var fromURI = ios.newURI(imageInfo.url, null, null);
            
            var msrv = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);
            var type = msrv.getTypeFromURI(fromURI);
            var mime = msrv.getFromTypeAndExtension(type, "");
            if(mime != null && !mime.extensionExists(imageInfo.fileExt)){
                imageInfo.setFileExt(mime.primaryExtension);
                ImagePicker.Logger.info("update file extension to " + mime.primaryExtension + " by MIME for image:" + imageInfo);
            }
        } catch (e) {
            ImagePicker.Logger.info("cannot update file extension by MIME for image" + imageInfo + ", e = " + e);
        }
    },
            
    /**
     * Constructs a new URI, using nsIIOService.
     *
     * @param aURL
     *            The URI spec.
     * @param aOriginCharset
     *            The charset of the URI.
     * @param aBaseURI
     *            Base URI to resolve aURL, or null.
     * @return an nsIURI object based on aURL.
     */
    makeURI: function(aURL, aOriginCharset, aBaseURI){
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        return ioService.newURI(aURL, aOriginCharset, aBaseURI);
    }
};

/** **************** CacheListener Object Class ******************** */
/**
 * Provides the CacheListener class
 *
 * @namespace ImagePicker
 * @class ImagePickerChrome.CacheListener
 * @constructor
 * @param {ImageInfo}
 *            image info object to update file size
 */
ImagePickerChrome.CacheListener = function(imageInfo){
    this.imageInfo = imageInfo;
};

ImagePickerChrome.CacheListener.prototype = {

    QueryInterface: function(iid){
        if (iid.equals(Ci.nsICacheListener)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    },
    
    onCacheEntryAvailable: function(/* in nsICacheEntryDescriptor */descriptor,    /*
     * in
     * nsCacheAccessMode
     */
    accessGranted, /* in nsresult */ status){
    
        this.imageInfo.loadFileSizeFromCacheCompleted = true;
        
        if(descriptor == null){
            return;
        }
        
        var fileSize = descriptor.dataSize;
        
        if ((fileSize && (fileSize > 0)) && ((this.imageInfo.fileSize == null) || (this.imageInfo.fileSize == 0))) {
            this.imageInfo.setFileSize(fileSize);
            
            ImagePicker.Logger.info("update file size to " + fileSize + " by async cache for " +
            this.imageInfo);
        } else {
            ImagePicker.Logger.warn("Ingore file size: " + fileSize + " for " + this.imageInfo);
        }
    }
};