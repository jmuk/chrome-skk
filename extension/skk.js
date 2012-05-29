var skk = {
};

(function() {

skk.modes = {}
skk.currentMode = 'hiragana';
skk.lookupCallbacks = {};
skk.roman = '';
skk.preedit = '';
skk.entries = {};

skk.initDictionary = function() {
    skk.dictWorker = new Worker('../extension/dictionary_loader.js');
    skk.dictWorker.addEventListener('message', function (ev) {
        if (ev.data.type == 'update_status') {
            console.log(ev.data.percent);
        } else if (ev.data.type == 'lookup_result') {
            if (skk.lookupCallbacks[ev.data.reading]) {
                skk.lookupCallbacks[ev.data.reading](ev.data.data);
                skk.lookupCallbacks[ev.data.reading] = null;
            }
        }
        console.log(ev.data);
    });
    skk.dictWorker.postMessage(
        {type:'init', dictionary_filename:'SKK-JISYO.L.gz'});
};

skk.lookup = function(reading, callback) {
    skk.lookupCallbacks[reading] = callback;
    skk.dictWorker.postMessage({type:'lookup', reading:reading});
}

skk.registerMode = function(modeName, keyHandler, initHandler) {
    skk.modes[modeName] = {
        keyHandler: keyHandler,
        initHandler: initHandler
    };
};

skk.switchMode = function(newMode) {
    chrome.input.ime.clearComposition(skk.context);
    skk.roman = '';
    skk.currentMode = newMode;
    var initHandler = skk.modes[skk.currentMode].initHandler;
    if (initHandler) {
        initHandler();
    }
};

skk.handleKeyEvent = function(keyevent) {
    var keyHandler = skk.modes[skk.currentMode].keyHandler;
    if (keyHandler) {
        keyHandler(keyevent);
    }
}
})()
