var skk = {
    context: null,
    modes: {},
    currentMode: 'hiragana',
    lookupCallbacks: {},
    roman: '',
    preedit: '',
    okuriPrefix: '',
    okuriText: '',
    caret: null,
    entries: null
};

skk.commitText = function(text) {
    chrome.input.ime.commitText(skk.context, text);
};

skk.setComposition = function(
    text, selectionStart, selectionEnd, caret, segments) {
    chrome.input.ime.setComposition(
        skk.context, text, selectionStart, selectionEnd, caret, segments);
}

skk.clearComposition = function() {
    chrome.input.ime.clearComposition(skk.context);
}

skk.sendKeyEvent = function(keyevent) {
    chrome.input.ime.sendKeyEvent(skk.context, keyevent);
}

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

skk.registerMode = function(modeName, mode) {
    skk.modes[modeName] = mode;
};

skk.switchMode = function(newMode) {
    skk.currentMode = newMode;
    var initHandler = skk.modes[skk.currentMode].initHandler;
    if (initHandler) {
        initHandler(skk);
    }
};

skk.handleKeyEvent = function(keyevent) {
    var keyHandler = skk.modes[skk.currentMode].keyHandler;
    if (keyHandler) {
        keyHandler(skk, keyevent);
    }

    // currentMode may be changed during keyHandler, so we need to re-lookup
    // the modes here.
    var compositionHandler = skk.modes[skk.currentMode].compositionHandler;
    if (compositionHandler) {
        compositionHandler(skk);
    } else {
        chrome.input.ime.clearComposition(skk.context);
    }
}
