/** **************** Options Class ******************** */
const Cc = Components.classes;
const Ci = Components.interfaces;
Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/settings.js");

/**
 * JavaScript for Options windonws
 *
 * @namespace ImagePickerChrome
 * @class ImagePickerChrome.Options
 * @constructor
 */
ImagePickerChrome.Options = {

    onLoad : function() {
        ImagePicker.Logger.debug("Call onLoad()");

        // Handle save single image option
        var savedSingleImageOption = ImagePicker.Settings.getSavedSingleImageToOption();
        ImagePicker.Logger.debug("savedSingleImageOption =" + savedSingleImageOption);

        var askMeRadio = document.getElementById(savedSingleImageOption + "Radio");
        askMeRadio.click();

        this.enableOrDisableRenamingElements(ImagePicker.Settings.isRenamingEnabled());

        // init RemoveText Elements
        this.enableOrDisableCreatedByTitleElements(ImagePicker.Settings.isCreatedFolderByTitle());
    },

    selectCreatedFolderByTitle : function(aEvent) {

        var createdFolderByTitleCheckBox = aEvent.target;
        this.enableOrDisableCreatedByTitleElements(createdFolderByTitleCheckBox.checked);
    },

    enableOrDisableCreatedByTitleElements : function(enable) {

        var showSubfolderNameInUI = document
                .getElementById("showSubfolderNameInUI");

        if (enable) {
            showSubfolderNameInUI.disabled = false;
        } else {
            showSubfolderNameInUI.disabled = true;
            showSubfolderNameInUI.checked = false;
        }
    },

    enableOrDisableRenamingElements : function(enable) {

        var renamingMaskTextbox = document
                .getElementById("renamingMaskTextbox");

        if (enable) {
            renamingMaskTextbox.disabled = false;
        } else {
            renamingMaskTextbox.disabled = true;
        }
    },

    enableOrDisableIpFolderElements : function(enable) {

        var ipFolderTextbox = document.getElementById("ipFolderTextbox");
        var ipFolderButton = document.getElementById("ipFolderButton");
        var ipFolderCheckbox = document.getElementById("ipFolderCheckbox");

        if (enable) {
            ipFolderTextbox.disabled = false;
            ipFolderButton.disabled = false;
            ipFolderCheckbox.disabled = false;
        } else {
            ipFolderTextbox.disabled = true;
            ipFolderButton.disabled = true;
            ipFolderCheckbox.disabled = true;
        }
    },

    openTitleManagementDialog : function(event) {
        if (event) {
            event.stopPropagation();
        }
        openDialog('chrome://imagepicker/content/titleManagement.xul', '',
                'chrome,titlebar,resizable,centerscreen,modal=no,dialog=yes');
    },

    restoreAll : function() {

        var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
        var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                       .getService(Components.interfaces.nsIVersionComparator);
        var isUnderV6 = versionChecker.compare(appInfo.version, "6") < 0;

        // restore
        var preferences = document.getElementsByTagName("preference");

        for ( var i = 0; i < preferences.length; i++) {
            ImagePicker.Logger.info("preference:" + preferences[i].id + ", hasUserValue = "
                    + preferences[i].hasUserValue);
            if(!isUnderV6 || preferences[i].hasUserValue){
                preferences[i].reset(); // preference.reset()
            }
        }

        this.enableOrDisableRenamingElements(false);

        // Restore RemoveText Elements
        this.enableOrDisableCreatedByTitleElements(true);

        // Restore save image to settings
        var askMeRadio = document.getElementById("askMeRadio");
        askMeRadio.click();

        // Restore RemoveTextFromTitle value
        ImagePicker.Settings.resetRemoveTextFromTitleRaw();

    },

    onDialogAccept : function() {

        // Handle save single image option
        var askMeRadio = document.getElementById("askMeRadio");
        var askMePerTabRadio = document.getElementById("askMePerTabRadio");

        if(askMeRadio.selected == true){
            ImagePicker.Settings.setSavedSingleImageToOption("askMe");
        } else if(askMePerTabRadio.selected == true){
            ImagePicker.Settings.setSavedSingleImageToOption("askMePerTab");
        } else {
            ImagePicker.Settings.setSavedSingleImageToOption("ipFolder");
        }

        ImagePicker.Logger.debug("Installing button...");
        var buttonNames = [ "ipbutton-simple", "ipbutton-all", "ipbutton-left", "ipbutton-right", "ipbuttons" ];
        buttonNames.forEach(function(buttonName) {
            var buttonId = buttonName + "-toolbar";
            var isShow = ImagePicker.Settings.isShowOnToolbar(buttonName);
            ImagePickerChrome.installButton("nav-bar", buttonId, isShow);
            ImagePicker.Logger.debug("Installed button: " + buttonId + " to toolbar, isShow=" + isShow);
        });
    },

    onDialogClose : function() {
        var prefWindow = document.getElementById("imagepicker-prefs");
        ImagePicker.Logger.debug("onDialogClose, prefWindow=" + prefWindow);
        if(prefWindow.instantApply){
            ImagePicker.Logger.debug("Call onDialogAccept() when instantApply is on.");
            this.onDialogAccept();
        }
    },

    /**
     * browse directory
     *
     * @method browseDir
     */
    browseDir : function() {

        var stringsBundle = document.getElementById("ip-string-bundle");
        var title = stringsBundle.getString('selectFloderTitle');

        var nsIFilePicker = Ci.nsIFilePicker;
        var filePicker = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        filePicker.init(window, title, nsIFilePicker.modeGetFolder);

        // locate current directory
        var pathTextBox = document.getElementById("ipFolderTextbox");
        var destPath = pathTextBox.value;
        var dest = ImagePicker.FileUtils.toDirectory(destPath);
        if (dest) {
            filePicker.displayDirectory = dest;
        }
        var result = filePicker.show();
        if (result == nsIFilePicker.returnOK) {
            pathTextBox.value = filePicker.file.path;
            pathTextBox.click(); // fix un-saved issue
        }
    }
}
