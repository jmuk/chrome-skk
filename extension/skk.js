var skk = {
};

(function() {

skk.modes = {}
skk.currentMode = 'hiragana';
skk.lookupCallbacks = {};
skk.roman = '';
skk.preedit = '';

skk.initDictionary = function() {
    skk.dictWorker = new Worker('../extension/dictionary_syncer.js');
    skk.dictWorker.addEventListener('message', function (ev) {
        if (ev.data.type == 'update_status') {
            document.getElementById('progress').innerHTML = ev.data.percent;
        } else if (ev.data.type == 'lookup_result') {
            if (skk.lookupCallbacks[ev.data.reading]) {
                skk.lookupCallbacks[ev.data.reading](ev.data.entries);
                skk.lookupCallbacks = null;
            }
        }
        console.log(ev.data);
    });
    skk.dictWorker.postMessage(
        {type:'init', dictionary_filename:'SKK-JISYO.L.gz'});
};

skk.lookup = function(reading, callback) {
    skk.lookupCallbacks[reading] = callback;
    skk.worker.postMessage({type:'lookup', reading:reading});
}

skk.registerMode = function(modeName, modeHandler) {
    skk.modes[modeName] = modeHandler;
};

skk.switchMode = function(newMode) {
    chrome.input.ime.clearComposition(skk.context);
    skk.roman = '';
    skk.preedit = '';
    skk.currentMode = newMode;
};
})()
