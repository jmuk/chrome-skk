var skk = {
};

(function() {

skk['modes'] = {}
skk['currentMode'] = 'hiragana';

skk.registerMode = function(modeName, modeHandler) {
    skk.modes[modeName] = modeHandler;
};

skk.switchMode = function(newMode) {
    chrome.input.ime.clearComposition(skk.context);
    skk.currentMode = newMode;
};
})()
