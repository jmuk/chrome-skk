(function() {

function createInternalSKK() {
    // TODO: implement
}

function updateComposition(skk) {
    if (!skk.entries) {
        return;
    }

    var entry = skk.entries.entries[skk.entries.index];
    if (!entry) {
        skk.clearComposition();
    }

    var preedit = '\u25bc' + entry.word;
    if (skk.okuriText.length > 0) {
        preedit += skk.okuriText;
    }
    if (entry.annotation) {
        preedit += ';' + entry.annotation;
    }
    skk.setComposition(preedit, 1, preedit.length, preedit.length,
                       [{start:0, end:1, style:'underline'}]);
}

function initConversion(skk) {
    skk.lookup(skk.preedit + skk.okuriPrefix, function(entries) {
        if (entries.length == 0) {
	    skk.internal = createInternalSKK(); 
        } else {
            skk.entries = {index:0, entries:entries};
	}
        updateComposition(skk);
    });
}

function conversionMode(skk, keyevent) {
    if (keyevent.key == ' ') {
        if (skk.entries.index > 2) {
            skk.entries.index += 7;
        } else {
            skk.entries.index++;
        }

        if (skk.entries.index >= skk.entries.entries.length) {
            // recursive word registration...
            skk.entries.index = 0;
        }
    } else if (keyevent.key == 'x') {
        if (skk.entries.index > 9) {
            skk.entries.index -= 7;
        } else {
            skk.entries.index--;
        }
        if (skk.entries.index < 0) {
            skk.entries = null;
            skk.preedit += skk.okuriText;
            skk.okuriText = '';
            skk.okuriPrefix = '';
            skk.switchMode('preedit');
        }
    } else if (keyevent.key == 'escape') {
        skk.entries = null;
        skk.preedit += skk.okuriText;
        skk.okuriText = '';
        skk.okuriPrefix = '';
        skk.switchMode('preedit');
    } else if (keyevent.key == 'shift' || keyevent.key == 'alt' ||
               keyevent.key == 'ctrl') {
        // do nothing.
    } else {
        skk.commitText(
            skk.entries.entries[skk.entries.index].word + skk.okuriText);
        skk.clearComposition();
        skk.entries = null;
        skk.okuriText = '';
        skk.okuriPrefix = '';
        if (keyevent.key == '>') {
            skk.preedit = '>';
            skk.switchMode('preedit');
        } else {
            skk.preedit = '';
            skk.switchMode('hiragana');
            skk.handleKeyEvent(keyevent);
        }
    }
}

SKK.registerMode('conversion', {
    keyHandler: conversionMode,
    initHandler: initConversion,
    compositionHandler: updateComposition
});
})()
