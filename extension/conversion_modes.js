(function() {

function updateComposition() {
    var entry = skk.entries.entries[skk.entries.index];
    if (!entry) {
        chrome.input.ime.clearComposition(skk.context);
    }

    var preedit = '\u25bc' + entry.word;
    if (entry.annotation) {
        preedit += ';' + entry.annotation;
        console.log(preedit);
    }
    chrome.input.ime.setComposition(
        skk.context, preedit, 1, preedit.length, preedit.length,
        [{start:0, end:1, style:'underline'}]);
}

function initConversion() {
    skk.lookup(skk.preedit, function(entries) {
        skk.entries = {index:0, entries:entries};
        console.log(skk.entries);
        if (entries.length == 0) {
            return;
        }

        updateComposition();
    });
}

function conversionMode(keyevent) {
    if (keyevent.key == ' ') {
        skk.entries.index++;
        if (skk.entries.index >= skk.entries.entries.length) {
            // recursive word registration...
            skk.entries.index = 0;
        }
        updateComposition();
    } else if (keyevent.key == 'x') {
        skk.entries.index--;
        if (skk.entries.index < 0) {
            skk.entries = {};
            skk.switchMode('preedit');
        }
        updateComposition();
    } else {
        chrome.input.ime.commitText(
            skk.context, skk.entries.entries[skk.entries.index].word);
        chrome.input.ime.clearComposition(skk.context);
        skk.preedit = '';
        skk.switchMode('hiragana');
        skk.handleKeyEvent(keyevent);
    }
}

skk.registerMode('conversion', conversionMode, initConversion);

})()
