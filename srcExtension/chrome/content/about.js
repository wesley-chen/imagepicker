/** **************** ImageInfo Object Class ******************** */
Components.utils.import("resource://imagepicker/common.js");

ImagePickerChrome.BrowserUtils = {
   
    loadHomepage: function(aEvent) {
        window.close();
        openUILinkIn(aEvent.target.getAttribute("homepageURL"), "tab");
    }
}
