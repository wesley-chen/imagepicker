Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/settings.js");
Components.utils.import("resource://imagepicker/fileUtils.js");
Components.utils.import("resource://gre/modules/PopupNotifications.jsm");

/**
 * Notification class
 *
 * @namespace Notification
 * @class ImagePickerChrome.Notification
 * @constructor
 */
ImagePickerChrome.Notification = function(title, savedFolderPath, browser, popupNotificationsSvc) {
    this.title = title;
    this.savedFolderPath = savedFolderPath;
    this.browser = browser;
    this.popupNotificationsSvc = popupNotificationsSvc;
    if (!this.popupNotificationsSvc) {
        this.popupNotificationsSvc = PopupNotifications;
    }

};

ImagePickerChrome.Notification.prototype = {
    show : function() {
        var fileUtils = ImagePicker.FileUtils;
        var alertListener = {
            observe : function(subject, topic, data) {
                if (topic == "alertclickcallback") {
                    var dir = fileUtils.toDirectory(data);
                    fileUtils.revealDirectory(dir);
                }
            }
        };

        var isUsedFirefoxStyle = ImagePicker.Settings.isUsedFirefoxBuildinNotification();
        var hasErrorWhenUsedOsStyle = false;

        if(!isUsedFirefoxStyle){
            try {
                var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
                alertsService.showAlertNotification("chrome://imagepicker/skin/img-picker_32.png", this.title,
                        this.savedFolderPath, true, this.savedFolderPath, alertListener, "ImagePickerAlert");
                //abcefg.throwEx();
            } catch (ex) {
                ImagePicker.Logger.error("Occured Error " + ex);
                hasErrorWhenUsedOsStyle = true;
            }
        }


        if (isUsedFirefoxStyle || hasErrorWhenUsedOsStyle) {
            var filePath = this.savedFolderPath;
            var openAction = function() {
                var dir = fileUtils.toDirectory(filePath);
                fileUtils.revealDirectory(dir);
            };

            var notification = this.popupNotificationsSvc.show(this.browser, /* browser */
            "ImagePickerAlert", this.title, null, /* anchor ID */
            {
                label : "Open",
                accessKey : "O",
                callback : openAction
            }, null /* secondary action */
            );

            setTimeout(function() {
                notification.remove();
            }, 1500);
            // Time in seconds to disappear the door-hanger popup.
        }
    }
};
