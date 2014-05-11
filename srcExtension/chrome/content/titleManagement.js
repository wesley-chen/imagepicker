/** **************** Controller Class ******************** */
const Cc = Components.classes;
const Ci = Components.interfaces;
Components.utils.import("resource://imagepicker/common.js");
Components.utils.import("resource://imagepicker/settings.js");

/**
 * Provides the TitleManager
 *
 * @namespace ImagePickerChrome
 * @class ImagePickerChrome.TitleManager
 * @constructor
 */
ImagePickerChrome.TitleManager = {

    onLoad : function() {

        var allNeedRemoveTexts = ImagePicker.Settings.getRemoveTextFromTitleRaw();
        var removeTextTB = document.getElementById("removeTextTB");
        removeTextTB.value = allNeedRemoveTexts;

        // populate windows title for "remove text"
        var removeTextMenulist = document.getElementById("removeTextMenulist");

        var windowTitle = this._getWindowTitle(window.opener.opener);
        var removeTexts = this._splitTitle(windowTitle);
        for (var i = 0; i < removeTexts.length; i++) {
            var item = removeTextMenulist.appendItem(removeTexts[i]);
            item.setAttribute("crop", "none");
        }
    },

    _getWindowTitle : function(win) {
        if (!win) {
            return "";
        }

        var title = win.document.title;
        ImagePicker.Logger.debug("window: " + win + ", title: " + title);

        if (title) {
            return title;
        } else {
            return this._getwinTitle(win.opener);
        }
    },

    _splitTitle : function(windowTitle) {

        var results = new Array();

        if (windowTitle != null && windowTitle != "") {

            var headTexts = new Array();
            var tailTexts = new Array();

            var separatorRE = /\t|-|_|\|/g;
            var result = separatorRE.exec(windowTitle);
            while (result != null) {
                var hText = windowTitle.substring(0, separatorRE.lastIndex);
                headTexts.push(hText);

                var tText = windowTitle.substring(result.index);
                tailTexts.push(tText);

                result = separatorRE.exec(windowTitle);
            }

            results = headTexts.concat(tailTexts);
        }

        return results;
    },

    addRemoveText : function() {
        var removeTextMenulist = document.getElementById("removeTextMenulist");
        var text = removeTextMenulist.value;
        if (text && text.trim() != "") {
            var removeTextTB = document.getElementById("removeTextTB");
            removeTextTB.value = text + "\n" + removeTextTB.value;
            ImagePicker.Settings.setRemoveTextFromTitleRaw(removeTextTB.value);
        }
    },

    onDialogAccept : function() {
        var removeTextTB = document.getElementById("removeTextTB");
        ImagePicker.Settings.setRemoveTextFromTitleRaw(removeTextTB.value);
    }
};

