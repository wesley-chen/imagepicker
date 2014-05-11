/** **************** Controller Class ******************** */
const
Cc = Components.classes;
const
Ci = Components.interfaces;
Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/hashMap.js");
Components.utils.import("resource://imagepicker/fileUtils.js");
Components.utils.import("resource://imagepicker/settings.js");
Components.utils.import("resource://imagepicker/xulUtils.js");
Components.utils.import("resource://imagepicker/model.js");
Components.utils.import("resource://imagepicker/filters.js");
Components.utils.import("resource://imagepicker/download.js");

/**
 * Provides the controller
 * 
 * @namespace ImagePickerChrome
 * @class ImagePickerChrome.Controller
 * @constructor
 */
ImagePickerChrome.Controller = {

    /**
     * callback function for loading pick window
     * 
     * @method init
     */
    init : function() {
        // Get preferences
        this.settings = ImagePicker.Settings;

        this.rawImageList = window.arguments[0].imageList;
        this.browser = window.arguments[0].browser;
        this.popupNotifications = window.arguments[0].popupNotifications;

        var postSavedListenersFromArgument = window.arguments[0].listeners;

        /**
         * Register the given listener to extend the after image saving behavior The given listener must have a
         * afterSavedImages() method.
         */
        var postSavedListener = {
            afterSavedImages : function(savedFolder, images) {
                // open Explorer after saved if need
                if (ImagePicker.Settings.isOpenExplorerAfterSaved()) {
                    ImagePicker.FileUtils.revealDirectory(savedFolder);
                }

                // close ImagePicker dialog after saved if need
                if (ImagePicker.Settings.isCloseImagePickerAfterSaved()) {
                    self.close();
                }
            }
        };

        this.postSavedListeners = [ postSavedListener ];
        this.postSavedListeners = this.postSavedListeners.concat(postSavedListenersFromArgument);
        ImagePicker.Logger.debug("Argument listeners: " + postSavedListenersFromArgument.length);
        ImagePicker.Logger.debug("PostSavedListeners: " + this.postSavedListeners.length);

        this.imageList = this.rawImageList;
        this.selectedMap = new ImagePicker.HashMap();
        this.filter = null;

        // init image grid
        var gridSize = window.innerWidth - 6;

        var thumbnailType = this.settings.getThumbnailType();
        var isShowImageSize = this.settings.isShowImageSize();
        var isShowImageName = this.settings.isShowImageName();
        this.imageGrid = new ImagePickerChrome.ImageGrid("imageContainer", gridSize, thumbnailType, isShowImageSize,
                isShowImageName);

        // Store the resize flag for first open
        this.MIN_WINDOW_WIDTH = 772;
        this.isResizeToMinWidth = false;
    },

    /**
     * callback function for loading pick window
     * 
     * @method loadPickWindow
     */
    loadPickWindow : function() {

        // init window title
        window.document.title = window.arguments[0].title;

        // init window from preferences
        document.getElementById("minWidthTB").value = this.settings.getMinWidth();
        document.getElementById("minHeightTB").value = this.settings.getMinHeight();
        document.getElementById("minSizeTB").value = this.settings.getMinSize();

        document.getElementById("imageTypeBmpCB").checked = !this.settings.isSkipImageTypeBMP();
        document.getElementById("imageTypeJpegCB").checked = !this.settings.isSkipImageTypeJPG();
        document.getElementById("imageTypePngCB").checked = !this.settings.isSkipImageTypePNG();
        document.getElementById("imageTypeGifCB").checked = !this.settings.isSkipImageTypeGIF();

        var thumbnailType = this.settings.getThumbnailType();
        switch (thumbnailType) {
        case 'small':
            document.getElementById("thumbnailTypeSmallMI").setAttribute("checked", true);
            break;
        case 'normal':
            document.getElementById("thumbnailTypeNormalMI").setAttribute("checked", true);
            break;
        case 'large':
            document.getElementById("thumbnailTypeLargeMI").setAttribute("checked", true);
            break;
        default:
            ImagePicker.Logger.info("gDisplayRule.thumbnailType = " + thumbnailType);
        }

        var isShowImageSize = this.settings.isShowImageSize();
        var isShowImageName = this.settings.isShowImageName();
        document.getElementById("showImageSizeMI").setAttribute("checked", isShowImageSize);
        document.getElementById("showImageNameMI").setAttribute("checked", isShowImageName);

        this._renderSavedFolderPathMenuList();
        this._renderSavedSubFolder();

        this.doFilter();

        // add event
        window.addEventListener("resize", function() {
            ImagePickerChrome.Controller.onResize();
        }, true);
    },

    _renderSavedFolderPathMenuList : function() {

        var savedPathMenulist = document.getElementById("savedPathMenulist");

        // Remove all menu items except menu separator and "Clear all" menu items
        var endIndex = savedPathMenulist.itemCount - 3;
        for (var i = endIndex; i >= 0; i--) {
            savedPathMenulist.removeItemAt(i);
        }
        savedPathMenulist.selectedIndex = -1;

        // Add menu items from settings
        var paths = this.settings.getSavedFolderPaths();
        for (var i = 0; i < paths.length; i++) {
            var item = savedPathMenulist.insertItemAt(i, paths[i]);
        }

        // select one
        if (paths.length > 0) {
            savedPathMenulist.selectedIndex = 0;
        } else {
            savedPathMenulist.selectedIndex = -1;
        }

        // enable "Clear All" menu item only if have path
        var clearAllSavedPathsMenuItem = document.getElementById("clearAllSavedPathsMenuItem");
        clearAllSavedPathsMenuItem.disabled = (paths.length == 0);
    },

    _addSavedFolderPath : function(path) {

        this.settings.addSavedFolderPath(path);

        // update UI
        this._renderSavedFolderPathMenuList();
    },

    clearAllSavedPaths : function(path) {

        this.settings.clearSavedFolderPaths(path);

        // update UI
        this._renderSavedFolderPathMenuList();
    },

    _renderSavedSubFolder : function() {

        var savedSubFolderMenulist = document.getElementById("savedSubFolderMenulist");
        if (!(this.settings.isCreatedFolderByTitle() && this.settings.isShowSubfolderInUI())) {
            savedSubFolderMenulist.hidden = true;
            return;
        }

        // Create sub-folder
        var subFolderName = ImagePicker.FileUtils.makeFolderNameByTitle(window.document.title);

        // prepare menu items
        var folders = [];
        // locate current directory
        var destPath = document.getElementById("savedPathMenulist").value;
        var dest = ImagePicker.FileUtils.toDirectory(destPath);
        if (dest && dest.isDirectory()) {
            var dirEntries = dest.directoryEntries;
            while (dirEntries.hasMoreElements()) {
                var entry = dirEntries.getNext();
                entry.QueryInterface(Components.interfaces.nsIFile);
                if (entry.isDirectory()) {
                    folders.push(entry);
                }
            }
        }

        // sort by last modified time DESC
        folders.sort(function(folder1, folder2) {
            return -(folder1.lastModifiedTime - folder2.lastModifiedTime);
        });

        var folderNames = [ subFolderName ];
        folders.forEach(function(folder) {
            folderNames.push(folder.leafName);
        });

        for (var i = 0; i < folderNames.length; i++) {
            savedSubFolderMenulist.insertItemAt(i, folderNames[i]);
        }

        savedSubFolderMenulist.selectedIndex = 0;

    },

    /**
     * callback function for unloading pick window
     * 
     * @method unloadPickWindow
     */
    unloadPickWindow : function() {

        // Get preferences
        // save display rule
        this.settings.setThumbnailType(this.imageGrid.thumbnailType);
        this.settings.setShowImageSize(this.imageGrid.isShowImageSize);
        this.settings.setShowImageName(this.imageGrid.isShowImageName);

        // save filter
        this.settings.setMinWidth(document.getElementById("minWidthTB").value);
        this.settings.setMinHeight(document.getElementById("minHeightTB").value);
        this.settings.setMinSize(document.getElementById("minSizeTB").value);

        this.settings.setSkipImageTypeJPG(!document.getElementById("imageTypeJpegCB").checked);
        this.settings.setSkipImageTypePNG(!document.getElementById("imageTypePngCB").checked);
        this.settings.setSkipImageTypeBMP(!document.getElementById("imageTypeBmpCB").checked);
        this.settings.setSkipImageTypeGIF(!document.getElementById("imageTypeGifCB").checked);

        // save saved folder
        this._addSavedFolderPath(document.getElementById("savedPathMenulist").value);
    },

    onResize : function() {

        if (!this.isResizeToMinWidth) {
            this.isResizeToMinWidth = true;
            var windowWidth = window.outerWidth;
            if (windowWidth < this.MIN_WINDOW_WIDTH) {
                window.sizeToContent();
                // window.resizeTo(this.MIN_WINDOW_WIDTH, window.outerHeight);
                ImagePicker.Logger.debug("ResizeToMinWidth: from " + windowWidth + " to " + window.outerWidth);
            }
        }

        this.refreshImageContainer();
    },

    /**
     * refresh image container
     * 
     * @method refreshImageContainer
     */
    refreshImageContainer : function() {

        var imageContainer = document.getElementById("imageContainer");

        // clean old image grid
        while (imageContainer.hasChildNodes()) {
            imageContainer.removeChild(imageContainer.firstChild);
        }

        // render image grid
        var gridWidth = window.innerWidth - 6;
        this.imageGrid.gridWidth = gridWidth;
        this.imageGrid.render(this.imageList, this.selectedMap);

        // display select status
        var imageIds = this.selectedMap.keys();
        for (var i = 0; i < imageIds.length; i++) {
            var imageId = imageIds[i];
            if (this.selectedMap.get(imageId) == true) {
                this._selectImage(imageId);
            }
        }
    },

    /**
     * filter images
     * 
     * @method doFilter
     */
    doFilter : function() {

        // update filer from UI
        var minWidth = document.getElementById("minWidthTB").value;
        var minHeight = document.getElementById("minHeightTB").value;
        var minSize = document.getElementById("minSizeTB").value;
        var skipImageTypes = new Array();
        if (!document.getElementById("imageTypeJpegCB").checked) {
            skipImageTypes.push("jpeg");
            skipImageTypes.push("jpg");
        }
        if (!document.getElementById("imageTypePngCB").checked) {
            skipImageTypes.push("png");
        }
        if (!document.getElementById("imageTypeBmpCB").checked) {
            skipImageTypes.push("bmp");
        }
        if (!document.getElementById("imageTypeGifCB").checked) {
            skipImageTypes.push("gif");
        }

        var sizeFilter = new ImagePicker.SizeFilter(minSize * 1000, -1, true);
        var widthFilter = new ImagePicker.WidthFilter(minWidth, -1, true);
        var heightFilter = new ImagePicker.HeightFilter(minHeight, -1, true);
        var skipImageTypeFilter = new ImagePicker.SkipImageTypeFilter(skipImageTypes);

        this.filter = new ImagePicker.Filter(sizeFilter, widthFilter, heightFilter, skipImageTypeFilter);

        // do filter
        this.imageList = this.filter.filterImageList(this.rawImageList);

        this.selectAllImages();

        // refresh image container
        this.refreshImageContainer();

        this.updateStatuBar();
    },

    /**
     * Show all images
     * 
     * @method doShowAll
     */
    doShowAll : function() {
        // do filter
        this.imageList = this.rawImageList;

        this.unselectAllImages();

        // refresh image container
        this.refreshImageContainer();

        this.updateStatuBar();
    },

    /**
     * view image for thumbnail type
     * 
     * @method doViewAS
     */
    doViewAS : function() {

        var thumbnailType = null;
        if (document.getElementById("thumbnailTypeSmallMI").getAttribute("checked") == 'true') {
            thumbnailType = 'small';
        } else if (document.getElementById("thumbnailTypeNormalMI").getAttribute("checked") == 'true') {
            thumbnailType = 'normal';
        } else if (document.getElementById("thumbnailTypeLargeMI").getAttribute("checked") == 'true') {
            thumbnailType = 'large';
        }
        this.imageGrid.setThumbnailType(thumbnailType);
        this.imageGrid.isShowImageSize = (document.getElementById("showImageSizeMI").getAttribute("checked") == 'true');
        this.imageGrid.isShowImageName = (document.getElementById("showImageNameMI").getAttribute("checked") == 'true');

        // refresh image container
        this.refreshImageContainer();
    },

    /**
     * browse directory
     * 
     * @method browseDir
     */
    browseDir : function() {

        var nsIFilePicker = Ci.nsIFilePicker;
        var filePicker = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        filePicker.init(window, this.getI18NString('selectFloderTitle'), nsIFilePicker.modeGetFolder);

        // locate current directory
        var destPath = document.getElementById("savedPathMenulist").value;
        var dest = ImagePicker.FileUtils.toDirectory(destPath);
        if (dest) {
            filePicker.displayDirectory = dest;
        }
        var result = filePicker.show();
        if (result == nsIFilePicker.returnOK) {
            this._addSavedFolderPath(filePicker.file.path);
        }
    },

    askSavedFolder : function() {

        // locate current directory
        var destPath = document.getElementById("savedPathMenulist").value;
        var dest = ImagePicker.FileUtils.toDirectory(destPath);

        if (!dest) {
            alert(this.getI18NString('invalidSaveFolder'));
            return null;
            ;
        }

        // Create sub-folder if need
        if (this.settings.isCreatedFolderByTitle()) {

            var subFolderName = document.getElementById("savedSubFolderMenulist").value;
            var subFolder = ImagePicker.FileUtils.createFolder(destPath, subFolderName);
            if (subFolder != null) {
                dest = subFolder;

                // Saved removed texts automatically
                var originalSubFolderName = window.document.title;
                var startPos = originalSubFolderName.indexOf(subFolderName);

                ImagePicker.Logger.debug("originalSubFolderName=" + originalSubFolderName + ", subFolderName="
                        + subFolderName + "startPos=" + startPos);

                if (startPos > -1) {
                    var removedHeaderText = originalSubFolderName.substring(0, startPos);
                    var removedTailText = originalSubFolderName.substring(startPos + subFolderName.length);
                    ImagePicker.Logger.debug("removedHeaderText=" + removedHeaderText + ", removedTailText="
                            + removedTailText);

                    var separatorRE = /\W|\s/g;
                    if (separatorRE.test(removedHeaderText)) {
                        ImagePicker.Logger.debug("add head text to be removed");
                        this.settings.addTextToBeRemoveFromTitle(removedHeaderText);
                    }
                    if (separatorRE.test(removedTailText)) {
                        ImagePicker.Logger.debug("add tail text to be removed");
                        this.settings.addTextToBeRemoveFromTitle(removedTailText);
                    }
                }
            }
        }

        return dest;
    },

    selectAllImages : function() {

        this.selectedMap = new ImagePicker.HashMap();
        for (var i = 0; i < this.imageList.length; i++) {
            var img = this.imageList[i];
            this._selectImage(img.id);
        }
        this.updateStatuBar();
        ImagePicker.Logger.debug("select all images ");
    },

    unselectAllImages : function() {

        this.selectedMap = new ImagePicker.HashMap();
        for (var i = 0; i < this.imageList.length; i++) {
            var img = this.imageList[i];
            this._unselectImage(img.id);
        }
        this.updateStatuBar();
        ImagePicker.Logger.debug("Unselect all images ");
    },

    _selectImage : function(imageId) {
        this.selectedMap.put(imageId, true);
        var checkbox = document.getElementById(imageId + "-CheckBox");
        if (checkbox) {
            checkbox.setAttribute("checked", true);
        }
        var imageCell = document.getElementById(imageId + "-CellBox");
        if (imageCell) {
            ImagePicker.XulUtils.addClass(imageCell, "image-cell-selected");
        }
    },

    _unselectImage : function(imageId) {
        this.selectedMap.put(imageId, false);
        var checkbox = document.getElementById(imageId + "-CheckBox");
        if (checkbox) {
            checkbox.setAttribute("checked", false);
        }
        var imageCell = document.getElementById(imageId + "-CellBox");
        if (imageCell) {
            ImagePicker.XulUtils.removeClass(imageCell, "image-cell-selected");
        }
    },

    selectSimilarImages : function(element) {

        // Find match URL
        var imageInfo = this.getImageFromPopupNode(element);
        if (!imageInfo) {
            return;
        }

        var imageURLDomain = imageInfo.url.substring(0, imageInfo.url.lastIndexOf('/'));
        ImagePicker.Logger.debug("Popup node: " + element.nodeName + ", ImageInfo = " + imageInfo
                + ", ImageURLDomain = " + imageURLDomain);

        // Select similar images
        var re = new RegExp(imageURLDomain);
        this.selectedMap = new ImagePicker.HashMap();
        for (var i = 0; i < this.imageList.length; i++) {
            var img = this.imageList[i];
            if (re.test(img.url)) {
                this._selectImage(img.id);
            } else {
                this._unselectImage(img.id);
            }
        }

        this.updateStatuBar();
        ImagePicker.Logger.debug("select similar images ");
    },

    handleOpenContextMenu : function() {
        var element = document.popupNode;
        var isImageCell = (this.getImageFromPopupNode(element) != null);
        document.getElementById("selectSimilarMenuItem").hidden = !isImageCell;
    },

    getImageFromPopupNode : function(popupNode) {

        var imageId = null;
        if (popupNode.nodeName == 'image') {
            imageId = popupNode.getAttribute("id");
        } else {
            var node = popupNode;
            while (node != null && node.nodeName != 'row') {
                var nodeId = node.getAttribute("id");
                if (nodeId) {
                    imageId = /\d+/.exec(nodeId)
                    break;
                }
                node = node.parentNode;
            }
        }

        // Find match ImageInfo
        var imageInfo = null;
        for (var i = 0; i < this.imageList.length; i++) {
            var img = this.imageList[i];
            if (img.id == imageId) {
                imageInfo = img;
                break;
            }
        }

        return imageInfo;
    },

    handleClickOnImage : function(imageId) {
        ImagePicker.Logger.debug("select image: " + imageId);
        var isSelected = this.selectedMap.get(imageId);
        if (isSelected) {// switch status
            this._unselectImage(imageId);
        } else {
            this._selectImage(imageId);
        }
        this.updateStatuBar();
    },

    updateStatuBar : function() {
        // update status bar
        var oldImageConut = this.rawImageList.length;
        var newImageConut = this.imageList.length;
        var selectedImageConut = 0;
        var values = this.selectedMap.values();
        for (var i = 0; i < values.length; i++) {
            if (values[i] == true) {
                selectedImageConut++;
            }
        }
        document.getElementById("filterStat").label = this.getFormattedString("statusBarText", [ newImageConut,
                selectedImageConut, oldImageConut ]);
    },

    /**
     * save image to local
     * 
     * @method doSaveImages
     */
    doSaveImages : function(images) {

        // locate saved directory
        var dest = this.askSavedFolder();
        if (!dest) {
            return;
        }

        // Collect saved files
        var savedImages = new Array();
        for (var i = 0; i < this.imageList.length; i++) {
            var img = this.imageList[i];
            if (this.selectedMap.get(img.id) == true) { // saved selected image only
                savedImages.push(img);
            }
        }

        if (savedImages.length == 0) {
            return;
        }

        var newDownloadProgressListener = new ImagePickerChrome.DownloadProgressListener(savedImages.length);
        var stringsBundle = this.getStringsBundle();

        var notificationTitle = stringsBundle.getFormattedString("saveNotificationTitleMultiple",
                [ savedImages.length ]);
        var notification = new ImagePickerChrome.Notification(notificationTitle, dest.path, this.browser,
                this.popupNotifications);
        notification.show();

        var privacyInfo = ImagePickerChrome.getPrivacyInfo();
        var downloadSession = new ImagePicker.DownloadSession(savedImages, dest, null, privacyInfo,
                newDownloadProgressListener, this.postSavedListeners, stringsBundle, true);
        downloadSession.saveImages();
    },

    getStringsBundle : function() {
        // Get a reference to the strings bundle
        if (this.stringsBundle == null) {
            this.stringsBundle = document.getElementById("ip-string-bundle");
        }
        return this.stringsBundle;
    },

    getI18NString : function(key) {
        // Get a reference to the strings bundle
        var stringsBundle = this.getStringsBundle();
        return stringsBundle.getString(key);
    },

    getFormattedString : function(key, parameters) {
        // Get a reference to the strings bundle
        var stringsBundle = this.getStringsBundle();
        return stringsBundle.getFormattedString(key, parameters);
    }
};

/** **************** DownloadProgressListener Object Class ******************** */
/**
 * Provides the DownloadProgressListener class
 * 
 * @namespace ImagePicker
 * @class ImagePickerChrome.DownloadProgressListener
 * @constructor
 */
ImagePickerChrome.DownloadProgressListener = function(totalCount) {
    this.completedCount = 0;
    this.totalCount = totalCount;
    this.id = Date.now();
};

ImagePickerChrome.DownloadProgressListener.prototype = {

    onDownloadStateChange : function(aState, aDownload) {
    },

    onStateChange : function(webProgress, request, stateFlags, status) {

        // NOTE: reload all Chrome will cause "Components is not defined" error,
        // restart firefox is OK
        if (typeof Components === "undefined") {
            return;
        }

        var wpl = Components.interfaces.nsIWebProgressListener;

        var isFinished = (stateFlags & wpl.STATE_STOP);

        if (isFinished) {
            this.completedCount = this.completedCount + 1;
            var totalProgress = Math.ceil((this.completedCount / this.totalCount) * 100);

            if (document) {
                var downloadMeter = document.getElementById("downloadMeter");
                var downloadStat = document.getElementById("downloadStat");

                if (downloadMeter) { // check null since the ImagePicker dialog may be closed
                    downloadMeter.value = totalProgress;
                }

                if (downloadStat) { // check null since the ImagePicker dialog may be closed
                    downloadStat.label = totalProgress + "%";
                }
            }

            if ((typeof ImagePicker != "undefined") && (ImagePicker != null)) { // check null since the ImagePicker
                                                                                // dialog may be closed
                ImagePicker.Logger.debug("Listener id =" + this.id + ", Downloaded: " + totalProgress);
            }
        }
    },

    onStatusChange : function(webProgress, request, status, message) {
    },
    onLocationChange : function(webProgress, request, location) {
    },
    onProgressChange : function(webProgress, request, curSelfProgress, maxSelfProgress, curTotalProgress,
            maxTotalProgress) {
    },
    onSecurityChange : function(webProgress, request, state) {
    }
};

/**
 * Init Controller.
 */
(function() {
    this.init();
}).apply(ImagePickerChrome.Controller);
