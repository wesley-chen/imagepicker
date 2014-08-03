/** **************** Image Listener related Classes ******************** */
var EXPORTED_SYMBOLS = [];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://imagepicker/common.js");
Cu.import("resource://imagepicker/model.js");

/**
 *  Provides the image extensions
 *
 * @namespace ImagePicker
 * @class ImagePicker.ImageListener
 * @constructor
 */
ImagePicker.ImageListener =  {
        
    /**
     * Empty implementation for override
     */
    postCreateIpSession: function(ipSession){
    },
        
    /**
     * Attempt to update file extension,size and name from cache
     *
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to be updated
     */
    postCreateImage: function(imageInfo, ipSession){
        
        ImagePicker.ImageListener._updateFileExtensionByMIME(imageInfo);
        
        ImagePicker.ImageListener._updateFileSizeFromCache(imageInfo, ipSession);

        ImagePicker.ImageListener._updateFileNameFromCache(imageInfo, ipSession);
    },
    
    /**
     * Empty implementation for override
     */
    _updateFileSizeFromCache: function(imageInfo , ipSession){
    },
        
    /**
     * Attempt to update file name from cache.
     *
     * @method _updateFileNameFromCache
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    _updateFileNameFromCache: function(imageInfo, ipSession){
    
        var imgICache = Ci.imgICache;
        var nsISupportsCString = Ci.nsISupportsCString;
        
        var aURL = imageInfo.url;
        var aDocument = ipSession.window.document;
        var charset = aDocument.characterSet;
        var contentType = null;
        var contentDisposition = null;
        try {
            var imageCache = Cc["@mozilla.org/image/cache;1"].getService(imgICache);
            var props = imageCache.findEntryProperties(ImagePicker.ImageListener._makeURI(aURL, charset));
            
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
     * @method _updateFileExtensionByMIME
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to updated
     */
    _updateFileExtensionByMIME: function(imageInfo){
       
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
    _makeURI: function(aURL, aOriginCharset, aBaseURI){
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        return ioService.newURI(aURL, aOriginCharset, aBaseURI);
    }
};