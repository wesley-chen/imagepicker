/** **************** Filter Object Class ******************** */
var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://imagepicker/common.js");
Cu.import("resource://imagepicker/model.js");

/**
 * Provides the filter for images
 *
 * @namespace ImagePicker
 * @class ImagePicker.Filter
 * @constructor
 * @param {SizeFilter}
 *            sizeFilter the filter for image size
 * @param {WidthFilter}
 *            widthFilter the filter for image width
 * @param {HeightFilter}
 *            heightFilter the filter for image height
 * @param {SkipImageTypeFilter}
 *            skipImageTypeFilter the filter for image type
 */
ImagePicker.Filter = function(sizeFilter, widthFilter, heightFilter, skipImageTypeFilter) {
    this.sizeFilter = sizeFilter;
    this.widthFilter = widthFilter;
    this.heightFilter = heightFilter;
    this.skipImageTypeFilter = skipImageTypeFilter;
};

ImagePicker.Filter.prototype = {

    /**
     * filter image list by Filter.
     *
     * @method filterImageList
     * @param {Array
     *            <ImageInfo>} imageList a array which contains all ImageInfo objects to filter
     * @return {Array<ImageInfo>} a array as filter result.
     */
    filterImageList : function(imageList) {

        var result = new Array();

        for ( var i = 0; i < imageList.length; i++) {
            // ImagePicker.Logger.info("Checking " + imageList[i]);
            if (this.sizeFilter.accept(imageList[i]) == false) {
                // ImagePicker.Logger.info("filter by size!");
                continue;
            }
            if (this.widthFilter.accept(imageList[i]) == false) {
                // ImagePicker.Logger.info("filter by width!");
                continue;
            }
            if (this.heightFilter.accept(imageList[i]) == false) {
                // ImagePicker.Logger.info("filter by height!");
                continue;
            }
            if (this.skipImageTypeFilter.accept(imageList[i]) == true) {
                // ImagePicker.Logger.info("filter by image types!");
                continue;
            }

            result.push(imageList[i]);
        }

        return result;
    }
};

/**
 * Provides the SizeFilter class
 *
 * @namespace ImagePicker
 * @class ImagePicker.SizeFilter
 * @constructor
 * @param {Number}
 *            minSize the mim size of image can be acceptable
 * @param {Number}
 *            minSize the max size of image can be acceptable
 * @param {boolean}
 *            acceptNullSize a flag to controll if a image have null size can be acceptable
 */
ImagePicker.SizeFilter = function(minSize, maxSize, acceptNullSize) {
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.acceptNullSize = acceptNullSize;
};

ImagePicker.SizeFilter.prototype = {

    /**
     * Check if the given ImageInfo is acceptable for this filter.
     *
     * @method accept
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to check
     * @return true if the image size is acceptable, otherwise return false.
     */
    accept : function(imageInfo) {

        if (this.acceptNullSize && ((imageInfo.fileSize == null) || (imageInfo.fileSize == 0))) {
            return true;
        } else if ((imageInfo.fileSize > this.minSize) && ((this.maxSize == -1) || (imageInfo.fileSize < this.maxSize))) {
            // ImagePicker.Logger.info("this.minSize = " + this.minSize + ",
            // this.maxSize = " + this.maxSize + ", fileSize=" +
            // imageInfo.fileSize);
            return true;
        }
        // ImagePicker.Logger.info("imageInfo.fileSize > this.minSize = " +
        // (imageInfo.fileSize > this.minSize));
        // ImagePicker.Logger.info("this.maxSize == -1 = " + (this.maxSize == -1));
        // ImagePicker.Logger.info("this.minSize = " + this.minSize + ",
        // this.maxSize = " + this.maxSize + ", fileSize=" +
        // imageInfo.fileSize);
        return false;
    }
};

/**
 * Provides the WidthFilter class
 *
 * @namespace ImagePicker
 * @class ImagePicker.WidthFilter
 * @constructor
 * @param {Number}
 *            minWidth the mim width of image can be acceptable
 * @param {Number}
 *            minWidth the max width of image can be acceptable
 * @param {boolean}
 *            acceptNullWidth a flag to controll if a image have null width can be acceptable
 */
ImagePicker.WidthFilter = function(minWidth, maxWidth, acceptNullWidth) {
    this.minWidth = minWidth;
    this.maxWidth = maxWidth;
    this.acceptNullWidth = acceptNullWidth;
};

ImagePicker.WidthFilter.prototype = {

    /**
     * Check if the given ImageInfo is acceptable for this filter.
     *
     * @method accept
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to check
     * @return true if the image width is acceptable, otherwise return false.
     */
    accept : function(imageInfo) {

        if (this.acceptNullWidth && ((imageInfo.width == null) || (imageInfo.width == 0))) {
            return true;
        } else if ((imageInfo.width > this.minWidth) && ((this.maxWidth == -1) || (imageInfo.width < this.maxWidth))) {
            return true;
        }
        return false;
    }
};

/**
 * Provides the HeightFilter class
 *
 * @namespace ImagePicker
 * @class ImagePicker.HeightFilter
 * @constructor
 * @param {Number}
 *            minHeight the mim height of image can be acceptable
 * @param {Number}
 *            minHeight the max height of image can be acceptable
 * @param {boolean}
 *            acceptNullHeight a flag to controll if a image have null height can be acceptable
 */
ImagePicker.HeightFilter = function(minHeight, maxHeight, acceptNullHeight) {
    this.minHeight = minHeight;
    this.maxHeight = maxHeight;
    this.acceptNullHeight = acceptNullHeight;
};

ImagePicker.HeightFilter.prototype = {

    /**
     * Check if the given ImageInfo is acceptable for this filter.
     *
     * @method accept
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to check
     * @return true if the image height is acceptable, otherwise return false.
     */
    accept : function(imageInfo) {

        if (this.acceptNullHeight && ((imageInfo.height == null) || (imageInfo.height == 0))) {
            return true;
        } else if ((imageInfo.height > this.minHeight) && ((this.maxHeight == -1) || (imageInfo.height < this.maxHeight))) {
            return true;
        }
        return false;
    }
};

/**
 * Provides the ImageTypeFilter class
 *
 * @namespace ImagePicker
 * @class ImagePicker.ImageTypeFilter
 * @constructor
 * @param {Array
 *            <String>} imageTypes the array which contians all image types can be acceptable
 * @param {boolean}
 *            acceptNullImageType a flag to controll if a image have null(empty) image type can be acceptable
 */
ImagePicker.ImageTypeFilter = function(imageTypes, acceptNullImageType, acceptAllImageType) {
    this.imageTypes = imageTypes;
    this.imageTypeString = imageTypes.join("-");
    this.acceptNullImageType = acceptNullImageType;
    this.acceptAllImageType = acceptAllImageType;
};

ImagePicker.ImageTypeFilter.prototype = {

    /**
     * Check if the given ImageInfo is acceptable for this filter.
     *
     * @method accept
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to check
     * @return true if the image type is acceptable, otherwise return false.
     */
    accept : function(imageInfo) {

        if (this.acceptAllImageType) {
            return true;
        } else if (this.acceptNullImageType && ((imageInfo.fileExt == null) || (imageInfo.fileExt == ""))) {
            return true;
        } else if (this.imageTypeString.indexOf(imageInfo.fileExt) > -1) {
            return true;
        }
        return false;
    }
};

/**
 * Provides the SkipImageTypeFilter class
 *
 * @namespace ImagePicker
 * @class ImagePicker.SkipImageTypeFilter
 * @constructor
 * @param {Array
 *            <String>} skipImageTypes the array which contians all image types cannot be acceptable
 */
ImagePicker.SkipImageTypeFilter = function(skipImageTypes) {
    this.skipImageTypes = skipImageTypes;
    this.skipImageTypeString = skipImageTypes.join("-");
};

ImagePicker.SkipImageTypeFilter.prototype = {

    /**
     * Check if the given ImageInfo is acceptable for this filter.
     *
     * @method accept
     * @param {ImageInfo}
     *            imageInfo The ImageInfo object to check
     * @return true if the image type is acceptable, otherwise return false.
     */
    accept : function(imageInfo) {

        if (this.skipImageTypeString.indexOf(imageInfo.fileExt) != -1) {
            return true;
        }
        return false;
    }
};