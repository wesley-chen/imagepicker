/** **************** Image Listener related Classes ******************** */
var EXPORTED_SYMBOLS = [];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://imagepicker/common.js");
Cu.import("resource://imagepicker/model.js");
Cu.import("resource://imagepicker/listenerBase.js");


ImagePicker.ImageListener.postCreateIpSession = function(ipSession){
   // init cache session
   var cacheService = Cc["@mozilla.org/network/cache-service;1"].getService(Ci.nsICacheService);
   var httpCacheSession = cacheService.createSession("HTTP", Ci.nsICache.STORE_ANYWHERE, Ci.nsICache.STREAM_BASED);
   httpCacheSession.doomEntriesIfExpired = false;
   ipSession.httpCacheSession = httpCacheSession;
};

ImagePicker.ImageListener._updateFileSizeFromCache = function(imageInfo , ipSession){
    
        // Update file size from sync cache first
        var url = imageInfo.url;
        var cacheKey = url.replace(/#.*$/, "");
        
        var fileSize = null;
        try {
            // try to get from http cache, return nsICacheEntryDescriptor            
            var descriptor = ipSession.httpCacheSession.openCacheEntry(cacheKey, Ci.nsICache.ACCESS_READ, false);
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
        
        // Update file size from async cache first
        if (imageInfo.fileSize <= 0) {
            
            ImagePicker.Logger.info(" try to update file size by async cache for " + imageInfo);
            
            // try to update file size by cache listener
            var listener = new ImagePicker.CacheListener(imageInfo);
            try {
                ipSession.httpCacheSession.asyncOpenCacheEntry(cacheKey, Ci.nsICache.ACCESS_READ, listener);
            } catch (ecache) {
                ImagePicker.Logger.warn("Cannot update file size by async Cache for " + imageInfo, ecache);
            }
        }
};

/** **************** CacheListener Object Class ******************** */
/**
 * Provides the CacheListener class
 *
 * @namespace ImagePicker
 * @class ImagePicker.CacheListener
 * @constructor
 * @param {ImageInfo}
 *            image info object to update file size
 */
ImagePicker.CacheListener = function(imageInfo){
    this.imageInfo = imageInfo;
};

ImagePicker.CacheListener.prototype = {

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