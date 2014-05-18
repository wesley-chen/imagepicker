var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://imagepicker/common.js");

/** **************** Renamer Object Class ******************** */
/**
 * Provides the Renamer class to rename image before saved images
 *
 * @namespace ImagePicker
 * @class ImagePicker.Renamer
 * @constructor
 */
ImagePicker.Renamer = function(renamingMask, renamingStartNum) {
    this.renamingMask = renamingMask;
    this.renamingStartNum = renamingStartNum;
};

ImagePicker.Renamer.prototype = {

    rename: function(images){
        var masks = this.renamingMask;
        var startNum = this.renamingStartNum;
        ImagePicker.Logger.debug("Renaming masks: " + masks + ", images.length = " + images.length);
        if(masks == null || masks == ""){
            return;
        }

        var needRenameBySeq = /<seq_num>/.test(masks);
        var needRenameByDate = /<date>/.test(masks);
        var needRenameByDatetime = /<datetime>/.test(masks);
        var needRenameByTabTitle = /<tab_title>/.test(masks);
        var needRenameByOriginalName = /<name>/.test(masks);

        var maxDigits = images.length.toString().length;
        var seq = new ImagePicker.Sequence(startNum, maxDigits);

        var date = new Date();
        var dateStr = date.getFullYear() + "-" + (date.getMonth() +1) + "-" + date.getDate();
        var datetimeStr = dateStr + " " + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();

        for ( var i = 0; i < images.length; i++) {
            var img = images[i];
            var newName = masks;
            // Replace sequence number
            if(needRenameBySeq){
                newName = newName.replace(/<seq_num>/g, seq.next());
            }
            // Replace date
            if(needRenameByDate){
               newName = newName.replace(/<date>/g, dateStr);
            }
            // Replace datetime
            if(needRenameByDatetime){
               newName = newName.replace(/<datetime>/g, datetimeStr);
            }
            // Replace tab title
            if(needRenameByTabTitle){
               newName = newName.replace(/<tab_title>/g, img.tabTitle);
            }
            // Replace original name
            if(needRenameByOriginalName){
               newName = newName.replace(/<name>/g, img.fileName);
            }

            ImagePicker.Logger.debug("Renaming from " + img.fileName  + " to: " + newName);
            img.fileName = newName;
        }
    }
};