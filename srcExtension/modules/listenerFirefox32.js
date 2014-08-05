/** **************** Image Listener related Classes ******************** */
var EXPORTED_SYMBOLS = [];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://imagepicker/common.js");
Cu.import("resource://imagepicker/model.js");
Cu.import("resource://imagepicker/listenerBase.js");
Cu.import("resource://gre/modules/LoadContextInfo.jsm");


ImagePicker.ImageListener.postCreateIpSession = function(ipSession){
          
      var cacheService = Cc["@mozilla.org/netwerk/cache-storage-service;1"]
                         .getService(Ci.nsICacheStorageService);
       
      var storage = cacheService.diskCacheStorage(LoadContextInfo.default, false);
      ipSession.cacheStorage = storage;
};

ImagePicker.ImageListener._updateFileSizeFromCache = function(imageInfo , ipSession){

    ImagePicker.Logger.info(" try to update file size by async cache for " + imageInfo);
    
    var aURL = imageInfo.url.replace(/#.*$/, "");
    var aDocument = ipSession.window.document;
    var charset = aDocument.characterSet;
    
    var cacheKey = ImagePicker.ImageListener._makeURI(aURL, charset);
        
    // try to update file size by cache listener
    var listener = new ImagePicker.CacheListener(imageInfo);
    try {

        ipSession.cacheStorage.asyncOpenURI(cacheKey, "", Ci.nsICacheStorage.OPEN_NORMALLY, listener);
  
    } catch (ecache) {
        ImagePicker.Logger.warn("Cannot update file size by async Cache for " + imageInfo, ecache);
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

      onCacheEntryCheck: function (entry, appcache) {
          return Ci.nsICacheEntryOpenCallback.ENTRY_WANTED;
      },
    
      onCacheEntryAvailable: function (entry, isnew, appCache, status) {
          
          this.imageInfo.loadFileSizeFromCacheCompleted = true;
          
          if(entry == null || !entry.persistent){
              return;
          }
          
          var fileSize = 0;
          try{
              fileSize = entry.dataSize;
          } catch (ecache) {
              ImagePicker.Logger.info("Use predictedDataSize for " +
                      this.imageInfo);
              fileSize = entry.predictedDataSize;
          }
          
          
          if ((fileSize > 0) && ((this.imageInfo.fileSize == null) || (this.imageInfo.fileSize == 0))) {
              this.imageInfo.setFileSize(fileSize);
              
              ImagePicker.Logger.info("update file size to " + fileSize + " by async cache for " +
              this.imageInfo);
          } else {
              ImagePicker.Logger.warn("Ingore file size: " + fileSize + " for " + this.imageInfo);
          }
      }
};