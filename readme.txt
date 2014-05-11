FireFox +
    1. Console2 (enable log from "Chrome" on Info level)
    2. Extension Developer or Developer Assistant (enable Debugging Preferences)
    3. Quick Locale Switcher
    4. DOM Inspector
    5. ChromeBug

https://developer.mozilla.org/en/Setting_up_extension_development_environment#Development_extensions

For development,
    1. Configure "firefox.dir" in build.xml
    2. Configure "firefox.profile.path" in build.xml if need.
    3. Run "ant test"
Note:
    1. Need restart FireFox if changed the "chrome.manifest" file or JS files under the "srcExtension/modules" directory
    2. Need touch "srcExtension" directory if changed the "install.rdf" file (Implemented in Ant task)

For release,
    1. Test for FireFox v4.0, FireFox v23
    2. Configure "extension.version" in build.xml
    3. Run "ant package"
    4. Verify by https://addons.mozilla.org/zh-CN/developers/addon/validate or https://addons.mozilla.org/zh-CN/developers/addon/check-compatibility
