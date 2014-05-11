pref('extensions.imagepicker.displayrule.thumbnailType', "small");
pref('extensions.imagepicker.displayrule.showImageSize', true);
pref('extensions.imagepicker.displayrule.showImageName', true);

pref('extensions.imagepicker.filter.minWidth', 80);
pref('extensions.imagepicker.filter.minHeight', 60);
pref('extensions.imagepicker.filter.minSize', 100);
pref('extensions.imagepicker.filter.skipImageTypes.bmp', false);
pref('extensions.imagepicker.filter.skipImageTypes.jpg', false);
pref('extensions.imagepicker.filter.skipImageTypes.png', false);
pref('extensions.imagepicker.filter.skipImageTypes.gif', true);

pref('extensions.imagepicker.ui.ipbuttons.toolbar.show', true);
pref('extensions.imagepicker.ui.ipbuttons.contextmenu.show', true);
pref('extensions.imagepicker.ui.ipbutton-simple.toolbar.show', false);
pref('extensions.imagepicker.ui.ipbutton-simple.contextmenu.show', false);
pref('extensions.imagepicker.ui.ipbutton-all.toolbar.show', false);
pref('extensions.imagepicker.ui.ipbutton-all.contextmenu.show', false);
pref('extensions.imagepicker.ui.ipbutton-right.toolbar.show', false);
pref('extensions.imagepicker.ui.ipbutton-right.contextmenu.show', false);
pref('extensions.imagepicker.ui.ipbutton-left.toolbar.show', false);
pref('extensions.imagepicker.ui.ipbutton-left.contextmenu.show', false);
pref('extensions.imagepicker.ui.notification.firefox-buildin', false);

pref('extensions.imagepicker.collector.doubleclickImageToSave.enable', true);
pref('extensions.imagepicker.collector.dragImageToSave.enable', true);

//askMe -- Always ask me where to save image
//askMePerTab -- Ask me where to save image for new tab
//ipFolder -- Save image to configured folder
pref('extensions.imagepicker.collector.savedSingleImageToOption', 'askMePerTab');
//The actual folder path
pref('extensions.imagepicker.collector.savedSingleImageToFolder', '');
pref('extensions.imagepicker.collector.createdFolderByTitle', true);
pref('extensions.imagepicker.collector.lastSavedTabId', "");
pref('extensions.imagepicker.collector.lastSavedFolder', "");

pref('extensions.imagepicker.savedFolderPathList', "");
pref('extensions.imagepicker.createdFolderByTitle', true);
// Mapping to show sub folder in UI
pref('extensions.imagepicker.showSubfolderNameConfirmationPopup', false);
pref('extensions.imagepicker.removeTextFromTitle', "- Mozilla Firefox\n- Powered by Discuz!");

pref('extensions.imagepicker.renamingEnable', false);
pref('extensions.imagepicker.renamingMask', "<seq_num>");

pref('extensions.imagepicker.openExplorerAfterSaved', true);
pref('extensions.imagepicker.openDownloadManagerAfterSaved', false);
pref('extensions.imagepicker.closeImagePickerAfterSaved', true);
pref('extensions.imagepicker.closeBrowserTabAfterSaved', false);

