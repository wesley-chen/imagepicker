/** **************** ImageGrid Object Class ******************** */
Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/model.js");
Components.utils.import("resource://imagepicker/xulUtils.js");

/**
 * Provides the view for images
 *
 * @namespace ImagePicker
 * @class ImagePickerChrome.ImageGrid
 * @constructor
 * @param {String}
 *            imageContainerId the id of HTML DIV which contains this image grid
 * @param {Number}
 *            gridWidth the width of this image grid
 */
ImagePickerChrome.ImageGrid = function(imageContainerId, gridWidth, thumbnailType, isShowImageSize, isShowImageName) {
    this.imageContainerId = imageContainerId;
    this.gridWidth = gridWidth;

    this.thumbnailType = thumbnailType;
    this.setThumbnailType(thumbnailType);

    this.isShowImageSize = isShowImageSize;
    this.isShowImageName = isShowImageName;
};

ImagePickerChrome.ImageGrid.prototype = {

    /**
     * set the thumbnail type to image grid.
     *
     * @method setThumbnailType
     * @param {String}
     *            thumbnailType "small","normal" and "large"
     */
    setThumbnailType : function(thumbnailType) {
        this.thumbnailType = thumbnailType;
        switch (thumbnailType) {
        case "small":
            this.thumbnailSize = 200;
            break;
        case "normal":
            this.thumbnailSize = 300;
            break;
        case "large":
            this.thumbnailSize = 450;
            break;
        default:
            this.thumbnailSize = 200;
        }
    },

    _getWidthPerImage : function() {
        return this.thumbnailSize - 20;
    },
    
    /**
     * Render the image grid in UI.
     *
     * @method render
     * @param {List
     *            <ImageInfo>} imageList The list which contains all ImageInfo objects to render
     */
    render : function(imageList, selectedMap) {

        var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        var HTML_NS = "http://www.w3.org/1999/xhtml";

        var columnWidth = this.thumbnailSize;

        // calculate column count
        var columnCount = Math.floor(this.gridWidth / columnWidth);
        columnCount = Math.max(columnCount, 1);

        // calculate row count
        var rowCount = Math.ceil(imageList.length / columnCount);

        ImagePicker.Logger.info("Creating Image Grid: " + this + ", columnWidth = " + columnWidth + ", columnCount = "
                + columnCount + ", rowCount = " + rowCount);

        // create grid
        var imgGrid = document.createElementNS(XUL_NS, "grid");
        imgGrid.setAttribute("width", this.gridWidth);
        imgGrid.setAttribute("style", "margin:5px; ");

        // create columns for grid
        var columns = document.createElementNS(XUL_NS, "columns");
        for ( var j = 0; j < columnCount; j++) {
            var column = document.createElementNS(XUL_NS, "column");
            columns.appendChild(column);
        }
        imgGrid.appendChild(columns);

        // create rows for grid
        var rows = document.createElementNS(XUL_NS, "rows");
        var index = 0;
        for ( var i = 0; i < rowCount; i++) {
            var row = document.createElementNS(XUL_NS, "row");
            row.setAttribute("align", "center");
            for ( var j = 0; j < columnCount; j++) {

                var imgInfo = (index < imageList.length? imageList[index] : null);
                
                // create grid cell box
                var cellBox = this.createImageCell(imgInfo, columnWidth, selectedMap);
                row.appendChild(cellBox);

                index++;
            }
            rows.appendChild(row);
        }

        imgGrid.appendChild(rows);

        // add image grid to parent DIV
        var imageContainer = document.getElementById("imageContainer");
        imageContainer.appendChild(imgGrid);
    },
    
    createImageCell : function(imgInfo, cellWidth, selectedMap){
        var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        var cellBox = document.createElementNS(XUL_NS, "vbox");
        cellBox.setAttribute("width", cellWidth);
        cellBox.setAttribute("height", cellWidth + 50);
        cellBox.setAttribute("pack", "center");
        cellBox.setAttribute("align", "center");
        cellBox.setAttribute("class", "image-cell");

         if (imgInfo) {
            cellBox.setAttribute("id", imgInfo.id+"-CellBox");
            cellBox.addEventListener("mouseover", function(){
                ImagePicker.XulUtils.addClass(this,"image-cell-highlight");
            }, false);
            cellBox.addEventListener("mouseout", function(){
                ImagePicker.XulUtils.removeClass(this,"image-cell-highlight");
            }, false);
            cellBox.addEventListener("click", function(event){
                if (event.button == 0) { //Left mouse button click
                    ImagePickerChrome.Controller.handleClickOnImage(imgInfo.id);
                }
            }, false);
                     
            // create image box
            var imgBox = this.createImageBox(imgInfo);
          
            // show additional info
            var adBox = document.createElementNS(XUL_NS, "vbox");
            adBox.setAttribute("id", imgInfo.id+"-AdBox");
            adBox.setAttribute("align", "center");
            adBox.setAttribute("class", "ad-box");
            this.renderAdditionalInfo(imgInfo, adBox);
        
            //Add checkbox
            var checkbox = document.createElementNS(XUL_NS, "checkbox");
            checkbox.setAttribute("id", imgInfo.id+"-CheckBox");
            checkbox.setAttribute("checked", selectedMap.get(imgInfo.id));
            
            //register change listener
            var changeListener = {
                imgGrid: this,
                onPropertyChange: function(updatedImageInfo){
                    this.imgGrid.updateImageInfo(updatedImageInfo);
                }
            };
            imgInfo.registerChangeListener(changeListener);
            
            //layout
            cellBox.appendChild(imgBox);
            cellBox.appendChild(adBox);
            cellBox.appendChild(checkbox);
        }
        
        return cellBox;
    },
    
    createImageBox : function(imgInfo){
        var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
         
        // create image element
        //var imgElem = document.createElementNS(HTML_NS, "img");
        var imgElem = document.createElementNS(XUL_NS, "image");
        imgElem.setAttribute("id", imgInfo.id);
        imgElem.setAttribute("src", imgInfo.url);
        //imgElem.setAttribute("validate", "always");

        // calculate image width and height for display
        var widthPerImage = this._getWidthPerImage();
        var imageRate = widthPerImage / Math.max(imgInfo.width, imgInfo.height, 1);
        var width = Math.min(imageRate * imgInfo.width, imgInfo.width);
        var height = Math.min(imageRate * imgInfo.height, imgInfo.height);
        if(width == 0){ //sometimes, image is not load completed
            width = widthPerImage;
        }
        if(height == 0){//sometimes, image is not load completed
            height = widthPerImage;
        }

        imgElem.setAttribute("width", width);
        imgElem.setAttribute("height", height);
        
        var imgBox = document.createElementNS(XUL_NS, "vbox");
        imgBox.setAttribute("class", "image-box");
       
        imgBox.appendChild(imgElem);

        return imgBox;
    },
    
    renderAdditionalInfo :  function(imageInfo, adBox) {
        var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        
        var widthPerImage = this._getWidthPerImage();
        var additionalInfos = this.getAdditionalInfo(imageInfo, widthPerImage);
        for ( var k = 0; k < additionalInfos.length; k++) {
            var additionalLabel = document.createElementNS(XUL_NS, "label");
            additionalLabel.setAttribute("value", additionalInfos[k]);
            adBox.appendChild(additionalLabel);
        }
    },

    updateImageInfo : function(imageInfo) {
        
        if(document == null){ // sometimes, the pick windows is closed
            return;
        }

        var adBox = document.getElementById(imageInfo.id + "-AdBox");

        ImagePicker.Logger.debug("updateImageInfo to " + adBox + " for " + imageInfo);

        if (adBox != null) {
            // clean old additional info content
            while (adBox.hasChildNodes()) {
                adBox.removeChild(adBox.firstChild);
            }

            // Re-render
            var widthPerImage = this._getWidthPerImage();
            this.renderAdditionalInfo(imageInfo, adBox);
        }
    },

    /**
     * Get the additional info (image size, name...) to show on the image grid.
     *
     * @method getAdditionalInfo
     * @param {ImageInfo}
     *            imageInfo
     * @return {Array}
     */
    getAdditionalInfo : function(imageInfo, widthPerImage) {

        var additionalInfos = new Array();

        if (this.isShowImageSize) { // show image width, height and size
            var info = imageInfo.width + "x" + imageInfo.height + " ";
            if (imageInfo.fileSize > 0) {
                info = info + Math.ceil(imageInfo.fileSize / 1000) + "k ";
            } else if(imageInfo.loadFileSizeFromCacheCompleted == false){
                info = info + " loading ";
            } else {
                info = info + 0 + "k ";
            }
            ImagePicker.Logger.debug("AdditionalInfo1 " + info + " for " + imageInfo);
            additionalInfos.push(info);
        }

        if (this.isShowImageName) { // show image name
            var pxPerChar = 8;
            var info = imageInfo.getFileNameExt();
            if (info.length * pxPerChar > widthPerImage) {
                var limitLen =  widthPerImage / pxPerChar - "...".length;
                if (imageInfo.fileExt != null) {
                    limitLen = limitLen - imageInfo.fileExt.length;
                }
                
                info = imageInfo.fileName.substr(0, limitLen) + "...";
                if (imageInfo.fileExt != null) {
                    info = info + imageInfo.fileExt;
                }
            }
            ImagePicker.Logger.debug("AdditionalInfo2 " + info + " for " + imageInfo);
            additionalInfos.push(info);
        }
        return additionalInfos;
    },

    updateAdditionalInfo :  function(imageInfo) {
        var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

        var additionalInfos = this.getAdditionalInfo(imgInfo, widthPerImage);
        for ( var k = 0; k < additionalInfos.length; k++) {
            var additionalLabel = document.createElementNS(XUL_NS, "label");
            additionalLabel.setAttribute("value", additionalInfos[k]);
            adBox.appendChild(additionalLabel);
        }
    },

    toString : function() {
        var msg = "[Image Grid: gridWidth=" + this.gridWidth + ", thumbnailType=" + this.thumbnailType + "("
                + this.thumbnailSize + "), isShowImageName=" + this.isShowImageName + ", isShowImageSize="
                + this.isShowImageSize + "]";

        return msg;
    }
};
