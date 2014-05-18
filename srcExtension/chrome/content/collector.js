/** **************** Collector Class ******************** */
Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/settings.js");
Components.utils.import("resource://imagepicker/renamer.js");
Components.utils.import("resource://imagepicker/xulUtils.js");
Components.utils.import("resource://imagepicker/fileUtils.js");
Components.utils.import("resource://imagepicker/model.js");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://imagepicker/download.js");

/**
 * Provides the collector
 *
 * @namespace ImagePickerChrome
 * @class ImagePickerChrome.Collector
 * @constructor
 */
ImagePickerChrome.Collector = {
    dragEvent: null,

    /**
     * callback function for click event
     *
     * @method onClick
     */
    onClick : function(event) {
         ImagePicker.Logger.debug("on click");
         var enabled = (ImagePicker.Settings.isCtrlKeyClickImageToSaveEnabled() && event.ctrlKey)  
                       || (ImagePicker.Settings.isAltKeyClickImageToSaveEnabled() && event.altKey)  
                       || (ImagePicker.Settings.isShiftKeyClickImageToSaveEnabled() && event.shiftKey);  
         if(enabled){
             var imageElement = ImagePickerChrome.Collector.detectImageElement(event);
             if(imageElement){
                 ImagePickerChrome.Collector.saveImageFromElement(imageElement);
             }
         }
    },
    
    /**
     * callback function for double click event
     *
     * @method onDblClick
     */
	onDblClick : function(event) {
		 ImagePicker.Logger.debug("on Double click");
		 if(ImagePicker.Settings.isDoubleclickImageToSaveEnabled()){
		     var imageElement = ImagePickerChrome.Collector.detectImageElement(event);
		     if(imageElement){
		         ImagePickerChrome.Collector.saveImageFromElement(imageElement);
		     }
		 }
	},

	/**
     * callback function for dragstart event
     *
     * @method onDragend
     */
	onDragstart : function(event) {
	    ImagePickerChrome.Collector.dragEvent = event;
	    ImagePicker.Logger.debug("onDraggesture, node="+ event.target +", clientX=" + event.clientX + ", clientY=" + event.clientY
	        +", screenX=" + event.screenX + ", screenY=" + event.screenY);
	},

	/**
     * callback function for dragend event
     *
     * @method onDragend
     */
	onDragend : function(event) {
		 ImagePicker.Logger.debug("On dragend");
		 if(ImagePicker.Settings.isDragImageToSaveEnabled()){
		     var dragEvent = ImagePickerChrome.Collector.dragEvent;
		     dragEvent = (dragEvent == null? event : dragEvent);
		     var imageElement = ImagePickerChrome.Collector.detectImageElement(dragEvent);
		     if(imageElement){
		         ImagePickerChrome.Collector.saveImageFromElement(imageElement);
		     }
		 }
	},

	/**
     * Save image from the given element when the element is a image
     *
     * @method saveImageFromElement
     */
	saveImageFromElement : function(imageElement) {

		 var image = new ImagePicker.ImageInfo(1, imageElement, 0);
	     ImagePickerChrome.ImageUtils.updateFileExtensionByMIME(image);
	     ImagePickerChrome.ImageUtils.updateFileNameFromCache(image);

         var stringsBundle = document.getElementById("ip-string-bundle");
         var currentTabId = null;
         var startNum = 1;
         var currentTab = gBrowser.selectedTab;
         if(currentTab) {
             var browser = gBrowser.getBrowserForTab(currentTab);
             // remove unnecessary text from tab title
             var validTabTitle = ImagePicker.FileUtils.makeFolderNameByTitle(browser.contentDocument.title);
             image.tabTitle = validTabTitle;
             
             currentTabId = currentTab.getUserData("tabId");
             if(currentTabId == null){
                 currentTabId = "t-" + new Date().valueOf();
                 currentTab.setUserData("tabId", currentTabId, null);
             }
             
             startNum = currentTab.getUserData("startNum");
             if(startNum == null){
                 startNum = ImagePicker.Settings.getRenamingStartNum(false);
             }else{
                 startNum = startNum + 1;
             }
         }
         
         if(ImagePicker.Settings.isRenamingEnabled(false)){
             var masks = ImagePicker.Settings.getRenamingMask(false);                    
             var renamer = new ImagePicker.Renamer(masks, startNum);
             renamer.rename([image]);  
         }

		 var destDirOrFile = ImagePickerChrome.Collector.getOrCreateSavedFolderOrFile(image, currentTabId, stringsBundle);
		 if(destDirOrFile){
		     var destDir = destDirOrFile;
		     if(destDirOrFile.isFile()){
		         destDir = destDirOrFile.parent;
		         image.outputFile = destDirOrFile;
		     }
		     
             var notificationTitle = stringsBundle.getFormattedString("saveNotificationTitleSingle", [ image.getFileNameExt() ]);
             var notification = new ImagePickerChrome.Notification(notificationTitle, destDir.path, gBrowser.selectedBrowser);
             notification.show();

             var privacyInfo = ImagePickerChrome.getPrivacyInfo();
             var savedListeners = [];
    	     var downloadSession = new ImagePicker.DownloadSession([image], destDir, privacyInfo, null, savedListeners, stringsBundle);
    	     downloadSession.saveImages();
    	     
             if(ImagePicker.Settings.isRenamingEnabled(false)){
                 var masks = ImagePicker.Settings.getRenamingMask(false);
                 var isRenamedBySeq = /<seq_num>/.test(masks);
                 if(isRenamedBySeq && currentTab){
                     currentTab.setUserData("startNum", startNum, null);
                 }
             }
	     }
	},

	/**
     * @return a nsIFile object
     */

    getOrCreateSavedFolderOrFile : function(image, currentTabId, stringsBundle) {

        var title = stringsBundle.getString('collectorSaveImageDialogTitle');

        var savedSingleImageOption = ImagePicker.Settings.getSavedSingleImageToOption();

        ImagePicker.Logger.debug("savedSingleImageOption =  " + savedSingleImageOption + ", currentTabId=" + currentTabId);

        if (savedSingleImageOption == "askMe") {
            var lastSavedFolderPath = ImagePicker.Settings.getLastSavedFolder();
            var lastSavedFolder = ImagePicker.FileUtils.toDirectory(lastSavedFolderPath);
            var file = this.showSaveImageDialog(image, title, lastSavedFolder);
            if (file) {
                ImagePicker.Settings.setLastSavedFolder(file.parent.path);
            }
            return file;

        } else if (savedSingleImageOption == "askMePerTab") {

            var lastSavedFolderPath = ImagePicker.Settings.getLastSavedFolder();
            var lastSavedFolder = ImagePicker.FileUtils.toDirectory(lastSavedFolderPath);
            var lastSavedTabId = ImagePicker.Settings.getLastSavedTabId();

            if (lastSavedTabId != currentTabId || lastSavedFolder == null) {
                var file = this.showSaveImageDialog(image, title, lastSavedFolder);
                if (file) {
                    ImagePicker.Settings.setLastSavedFolder(file.parent.path);
                    ImagePicker.Settings.setLastSavedTabId(currentTabId);
                }
                return file;
            } else {
                return lastSavedFolder
            }
        } else {
            var destPath = ImagePicker.Settings.getSavedSingleImageToFolder();
            var destDir = ImagePicker.FileUtils.toDirectory(destPath);
            if (destDir == null) {
                var file = this.showSaveImageDialog(image, title, destDir);
                if (file) {
                    ImagePicker.Settings.setSavedSingleImageToFolder(file.parent.path);
                }
                return file;
            } else {
                if(ImagePicker.Settings.isCreatedFolderByTitleForSingle()){
                    var currentTabTitle = ImagePickerChrome.getCurrentBrowser().contentDocument.title;
                    var subFolderName = ImagePicker.FileUtils.makeFolderNameByTitle(currentTabTitle);
                    var subFolder = ImagePicker.FileUtils.createFolder(destPath, subFolderName);
                    if(subFolder != null){
                        destDir = subFolder;
                    }
                }
                return destDir
            }
        }
    },



    /**
     * @return a nsIFile object
     */
    showSaveImageDialog : function(image, title, initFolder) {

        var nsIFilePicker = Ci.nsIFilePicker;
        var filePicker = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        filePicker.init(window, title, nsIFilePicker.modeSave);
        filePicker.defaultExtension = image.fileExt;
        filePicker.defaultString = image.getFileNameExt();
        filePicker.appendFilters(nsIFilePicker.filterImages);

        // locate current directory
        if (initFolder == null) {
            filePicker.displayDirectory = initFolder;
        }

        var result = filePicker.show();
        if (result == nsIFilePicker.returnCancel) {
            return null;
        }

        var file = filePicker.file;
        if (!file.exists()) {
            try {
                file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0777);
            } catch(e) {
                ImagePicker.Logger.error("Cannot create file =  " + file.path);
            }
        }

        return file;
    },

   /**
     * @return a nsIFile object
     */
	detectImageElement : function(event) {

	     var htmlElement = event.target;
	     var tagName = htmlElement.tagName.toLowerCase();
		 var isOnImage = (tagName=="img");
		 var isOnLink = (tagName=="a");
		 ImagePicker.Logger.debug("trigger on image? " + isOnImage + " or on link = " + isOnLink + ", tag name = " + tagName);

		 if(isOnImage){
    		 return htmlElement;
         }

         // Check image link
         if(isOnLink){
             var imgRegExp = new RegExp("\.png|\.jpg|\.jpeg|\.bmp|\.gif|\.webp|\.tif", "g");
             var link = htmlElement.href.toLowerCase();
             if(link.match(imgRegExp)){
                 var HTML_NS = "http://www.w3.org/1999/xhtml";
                 var imgElem = document.createElementNS(HTML_NS, "img");
                 imgElem.src = link;

                 return imgElem;
             }
         }

         // Check all images under parent node on the same position
         var eventX = event.clientX;
         var eventY = event.clientY;

         var parentNode = htmlElement;
         for(var loop=0; (loop<2 && parentNode!=null); loop++) { // until 2nd level parent
             var imageElements = parentNode.getElementsByTagName('img');
             ImagePicker.Logger.debug("detect image, parentNode="+ parentNode +", images=" + imageElements.length +", eventX=" + eventX + ", eventY=" + eventY);

             if(imageElements.length == 1){
                 return imageElements[0];
             }

             for(var i=0; i<imageElements.length; i++) {
                 var imgElem = imageElements[i];
                 var point = ImagePickerChrome.Collector._getPosition(imgElem);
                 var isBetweenX = (point.left < eventX) && (eventX < (point.left + imgElem.offsetWidth));
                 var isBetweenY = (point.top < eventY) && (eventY < (point.top + imgElem.offsetHeight));
                 ImagePicker.Logger.debug("detect image, src="+ imgElem.src +", isBetweenX=" + isBetweenX + ", isBetweenY=" + isBetweenY);
                 if(isBetweenX && isBetweenY){
                     return imgElem;
                 }
             }
             parentNode = parentNode.parentNode;
         }


         return null;
    },

    /**
     * @return the absolute position of html element
     */
	_getPosition : function(htmlElement) {

	     var curleft = 0;
	     var curtop = 0;
	     if (htmlElement && htmlElement.offsetParent) {
	 	    do {
	 	         curleft += htmlElement.offsetLeft;
	 	         curtop += htmlElement.offsetTop;
	 	     } while (htmlElement = htmlElement.offsetParent);
	     }
	     return {left :curleft, top: curtop};
    }
};

window.addEventListener("click",ImagePickerChrome.Collector.onClick,false);
window.addEventListener("dblclick",ImagePickerChrome.Collector.onDblClick,false);
window.addEventListener("dragstart",ImagePickerChrome.Collector.onDragstart,false);
window.addEventListener("dragend",ImagePickerChrome.Collector.onDragend,false);
ImagePicker.Logger.info("Created Collector and registered event listener");