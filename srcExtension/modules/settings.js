/****************** Settings Object Class *********************/
var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://imagepicker/common.js");

/**
 * Provides the preference utilities and extensions used by the ImagePicker
 * @namespace ImagePicker
 * @class ImagePicker.Settings
 */
ImagePicker.Settings =  {

    _prefs : Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch(
                "extensions.imagepicker."),

    getThumbnailType: function(){
        return this._prefs.getCharPref("displayrule.thumbnailType");
    },

    setThumbnailType: function(tnType){
        return this._prefs.setCharPref("displayrule.thumbnailType", tnType);
    },

    isShowImageSize: function(){
        return this._prefs.getBoolPref("displayrule.showImageSize");
    },

    setShowImageSize: function(isShowImageSize){
        return this._prefs.setBoolPref("displayrule.showImageSize", isShowImageSize);
    },

    isShowImageName: function(){
        return this._prefs.getBoolPref("displayrule.showImageName");
    },

    setShowImageName: function(isShowImageName){
        return this._prefs.setBoolPref("displayrule.showImageName", isShowImageName);
    },

    getMinWidth: function(){
        return this._prefs.getIntPref("filter.minWidth");
    },

    setMinWidth: function(minWidth){
        return this._prefs.setIntPref("filter.minWidth", minWidth);
    },

    getMinHeight: function(){
        return this._prefs.getIntPref("filter.minHeight");
    },

    setMinHeight: function(minHeight){
        return this._prefs.setIntPref("filter.minHeight", minHeight);
    },

    getMinSize: function(){
        return this._prefs.getIntPref("filter.minSize");
    },

    setMinSize: function(minSize){
        return this._prefs.setIntPref("filter.minSize", minSize);
    },

    isSkipImageTypeBMP: function(){
        return this._prefs.getBoolPref("filter.skipImageTypes.bmp");
    },

    setSkipImageTypeBMP: function(isSkip){
        return this._prefs.setBoolPref("filter.skipImageTypes.bmp", isSkip);
    },

    isSkipImageTypeJPG: function(){
        return this._prefs.getBoolPref("filter.skipImageTypes.jpg");
    },

    setSkipImageTypeJPG: function(isSkip){
        return this._prefs.setBoolPref("filter.skipImageTypes.jpg", isSkip);
    },

    isSkipImageTypePNG: function(){
        return this._prefs.getBoolPref("filter.skipImageTypes.png");
    },

    setSkipImageTypePNG: function(isSkip){
        return this._prefs.setBoolPref("filter.skipImageTypes.png", isSkip);
    },

    isSkipImageTypeGIF: function(){
        return this._prefs.getBoolPref("filter.skipImageTypes.gif");
    },

    setSkipImageTypeGIF: function(isSkip){
        return this._prefs.setBoolPref("filter.skipImageTypes.gif", isSkip);
    },

    getSavedFolderPaths: function(){

        var pathList = this.getUnicodeChar(this._prefs, "savedFolderPathList");
        var paths = new Array();
        if(pathList.trim() != ""){
           paths = pathList.split("\n");
        }

        return paths;
    },

    addSavedFolderPath: function(path){
        var MAX_PATH_COUNT = 10;
        var paths = this.getSavedFolderPaths();

        var pathList = path;
        var pathCount = 1;
        for(var i=0; i< paths.length; i++){
            if(paths[i] != path){ // filter duplicate path
                pathList = pathList + "\n" + paths[i];
                pathCount++
            }
            if(pathCount >= MAX_PATH_COUNT){ //quit loop when reach the max limit
                break;
            }
        }

        this.setUnicodeChar(this._prefs, "savedFolderPathList", pathList);
    },

    clearSavedFolderPaths: function(){
        this.setUnicodeChar(this._prefs, "savedFolderPathList", "");
    },

    isCreatedFolderByTitle: function(){
        return this._prefs.getBoolPref("createdFolderByTitle");
    },

    isShowSubfolderInUI: function(){
        return this._prefs.getBoolPref("showSubfolderNameConfirmationPopup");
    },

    isRenamingEnabled: function(){
        return this._prefs.getBoolPref("renamingEnable");
    },

    getRenamingMask: function(){
        return this._prefs.getCharPref("renamingMask");
    },

    isOpenExplorerAfterSaved: function(){
        return this._prefs.getBoolPref("openExplorerAfterSaved");
    },

    isOpenDownloadManagerAfterSaved: function(){
        return this._prefs.getBoolPref("openDownloadManagerAfterSaved");
    },

    isCloseImagePickerAfterSaved: function(){
        return this._prefs.getBoolPref("closeImagePickerAfterSaved");
    },

    isCloseBrowserTabAfterSaved: function(){
        return this._prefs.getBoolPref("closeBrowserTabAfterSaved");
    },

    getRemoveTextFromTitle: function(){

        var text = this.getUnicodeChar(this._prefs, "removeTextFromTitle");
        var textLines = text.split("\n");

        var results = new Array();
        for(var i=0; i<textLines.length; i++){
            if (textLines[i] != null && textLines[i].trim() != "") {
                results.push(textLines[i]);
            }
        }

        //sort by length desc
        results = results.sort(
             function(a,b){
                   return b.length - a.length;
             }
        );

        return results;
    },

    addTextToBeRemoveFromTitle: function(text){

        if(!text || text.length < 3){
            return;
        }

        var storedTexts = this.getUnicodeChar(this._prefs, "removeTextFromTitle");
        storedTexts = storedTexts + "\n"
        if(!storedTexts || storedTexts.indexOf(text + "\n") > -1){
            return;
        }

        storedTexts = storedTexts + text;
        this.setUnicodeChar(this._prefs, "removeTextFromTitle", storedTexts);
    },

    getRemoveTextFromTitleRaw: function(){
        return this.getUnicodeChar(this._prefs, "removeTextFromTitle");
    },

    setRemoveTextFromTitleRaw: function(content){
        return this.setUnicodeChar(this._prefs, "removeTextFromTitle", content);
    },

    resetRemoveTextFromTitleRaw: function(content){
        return this._prefs.clearUserPref("removeTextFromTitle");
    },

    isDoubleclickImageToSaveEnabled: function(){
        return this._prefs.getBoolPref("collector.doubleclickImageToSave.enable");
    },

    isDragImageToSaveEnabled: function(){
        return this._prefs.getBoolPref("collector.dragImageToSave.enable");
    },

    getSavedSingleImageToFolder: function(){
        var path = this.getUnicodeChar(this._prefs, "collector.savedSingleImageToFolder");
        return path;
    },

    setSavedSingleImageToFolder: function(path){
        this.setUnicodeChar(this._prefs, "collector.savedSingleImageToFolder", path);
    },

    getSavedSingleImageToOption: function(){
        return this._prefs.getCharPref("collector.savedSingleImageToOption");
    },

    setSavedSingleImageToOption: function(option){
        return this._prefs.setCharPref("collector.savedSingleImageToOption", option);
    },

    getLastSavedFolder: function(){
        var path = this.getUnicodeChar(this._prefs, "collector.lastSavedFolder");
        return path;
    },

    setLastSavedFolder: function(path){
        this.setUnicodeChar(this._prefs, "collector.lastSavedFolder", path);
    },

    getLastSavedTabId: function(){
        return this._prefs.getCharPref("collector.lastSavedTabId");
    },

    setLastSavedTabId: function(tabId){
        return this._prefs.setCharPref("collector.lastSavedTabId", tabId);
    },

    isCreatedFolderByTitleForSingle: function(){
        return this._prefs.getBoolPref("collector.createdFolderByTitle");
    },

    isShowOnToolbar: function(button){
        var prefName = "ui." + button + ".toolbar.show";
        return this._prefs.getBoolPref(prefName);
    },

    isShowOnContextMenu: function(button){
	    var prefName = "ui." + button + ".contextmenu.show";
        return this._prefs.getBoolPref(prefName);
    },

    isUsedFirefoxBuildinNotification: function(button){
        return this._prefs.getBoolPref("ui.notification.firefox-buildin");
    },

    /**
     * Get a unicode char value from preference system for the given prefName
     * @method getUnicodeChar
     * @param {nsIPrefBranch} prefs the preference system branch object.
     * @param {String} prefName the preference name to get preference value.
     * @return {String} the preference value for the given prefName
     */
    getUnicodeChar: function(prefs, prefName){
        return prefs.getComplexValue(prefName, Ci.nsISupportsString).data;
    },

    /**
     * Set a unicode char value to preference system for the given prefName
     * @method setUnicodeChar
     * @param {nsIPrefBranch} prefs the preference system branch object.
     * @param {String} prefName the preference name.
     * @param {String} prefValue the preference value.
     */
    setUnicodeChar: function(prefs, prefName, prefValue){
        var supportsString = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        supportsString.data = prefValue;
        prefs.setComplexValue(prefName, Ci.nsISupportsString, supportsString);
    },

    /**
     * Check the OS have window taskbar
     */
    hasWinTaskbar: function(){
        var winTaskbar = Cc["@mozilla.org/windows-taskbar;1"];
        var winTaskbarSvc = (winTaskbar? winTaskbar.getService(Ci.nsIWinTaskbar) : null);
        return (winTaskbarSvc && winTaskbarSvc.available);
    }
};
