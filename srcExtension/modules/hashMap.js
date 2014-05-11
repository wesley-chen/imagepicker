var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://imagepicker/common.js");

ImagePicker.HashMap = function() {
    this.size = 0;
    this.entries = new Object();
};

ImagePicker.HashMap.prototype = {

    put : function(key, value) {
        if (!this.containsKey(key)) {
            this.size++;
        }
        this.entries[key] = value;
    },

    get : function(key) {
        return this.containsKey(key) ? this.entries[key] : null;
    },

    remove : function(key) {
        if (this.containsKey(key) && (delete this.entries[key])) {
            this.size--;
        }
    },

    containsKey : function(key) {
        return (key in this.entries);
    },

    containsValue : function(value) {
        for ( var prop in this.entries) {
            if (this.entries[prop] == value) {
                return true;
            }
        }
        return false;
    },

    keys : function() {
        var keys = new Array();
        for ( var prop in this.entries) {
            keys.push(prop);
        }
        return keys;
    },

    values : function() {
        var values = new Array();
        for ( var prop in this.entries) {
            values.push(this.entries[prop]);
        }
        return values;
    },

    size : function() {
        return this.size;
    },

    clear : function() {
        this.size = 0;
        this.entries = new Object();
    }
};