/**
 * ImagePickerChrome namespace.
 */
if ("undefined" == typeof (ImagePickerChrome)) {

	var ImagePickerChrome = {};

	ImagePickerChrome.openOptionsDialog = function(event) {
		if (event) {
			event.stopPropagation();
		}
		openDialog('chrome://imagepicker/content/options.xul', 'Options',
				'chrome,toolbar,resizable,centerscreen,modal=no,dialog=yes');
	};

	ImagePickerChrome.openAboutDialog = function(event) {
		if (event) {
			event.stopPropagation();
		}
		openDialog('chrome://imagepicker/content/about.xul', '',
				'chrome,titlebar,resizable,centerscreen,modal=no,dialog=yes');
	};

	/**
     * Installs the toolbar button with the given ID into the given
     * toolbar, if it is not already present in the document.
     *
     * @param {string} toolbarId The ID of the toolbar to install to.
     * @param {string} id The ID of the button to install.
     * @param {bool} isShow The flag indicate this button install or not
     */
    ImagePickerChrome.installButton = function(toolbarId, id, isShow) {
    	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    	var mainWindow = wm.getMostRecentWindow("navigator:browser");
    	var document = mainWindow.document;

        var toolbar = document.getElementById(toolbarId);
    	var button = document.getElementById(id);

        if (!button && isShow) {
            toolbar.insertItem(id, null);
            toolbar.setAttribute("currentset", toolbar.currentSet);
            document.persist(toolbar.id, "currentset");
            if (toolbarId == "addon-bar"){
                toolbar.collapsed = false;
            }
        } else if(!isShow){
            // get toolbar's currentset and remove all instances of your button if already stored
            var pattern = new RegExp(id + ",?", "gi");
            var newCurrentset = toolbar.currentSet.replace(pattern,"");

            // remove end of line comma is there is one
            if (newCurrentset.charAt(newCurrentset.length-1) == ",") {
            	newCurrentset = newCurrentset.substring(0, newCurrentset.length - 1);
            }

            toolbar.currentSet = newCurrentset;
            toolbar.setAttribute("currentset", newCurrentset);
            document.persist(toolbar.id, "currentset");
        }
    };

    ImagePickerChrome.getPrivacyInfo = function() {

        // get privacy context
        var privacyContext = null;
        var win = null;
        try {
            var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            var win = wm.getMostRecentWindow("navigator:browser");
            privacyContext = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsILoadContext);
        } catch(e) {
            Components.utils.reportError(e);
        }

        var inPrivateBrowsing = false;
        try {
            // Firefox 20+
            Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
            inPrivateBrowsing = PrivateBrowsingUtils.isWindowPrivate(win);
        } catch(e) {
            // pre Firefox 20 (if you do not have access to a doc.
            // might use doc.hasAttribute("privatebrowsingmode") then instead)
            try {
                inPrivateBrowsing = Components.classes["@mozilla.org/privatebrowsing;1"].getService(Components.interfaces.nsIPrivateBrowsingService).privateBrowsingEnabled;
            } catch(e) {
            }
        }
        return {
            "inPrivateBrowsing" : inPrivateBrowsing,
            "privacyContext" : privacyContext
        };
    };

}
