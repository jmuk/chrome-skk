(function() {
function isStarting(key, table) {
    var starting = false;
    for (var k in table) {
	if (k.indexOf(key) == 0) {
	    starting = true;
	}
    }
    return starting;
}

function processRoman(key, table, emitter) {
    skk.roman += key;
    if (table[skk.roman]) {
        emitter(table[skk.roman]);
        skk.roman = '';
        return;
    }

    if (skk.roman.length > 1 && skk.roman[0] == skk.roman[1]) {
        emitter(table['xtu']);
        skk.roman = skk.roman.slice(1);
    }

    if (isStarting(skk.roman, table)) {
        return;
    }

    if (skk.roman[0] == 'n') {
        emitter(table['nn']);
    }

    if (table[key]) {
        emitter(table[key]);
        skk.roman = '';
    } else if (isStarting(key, table)) {
        skk.roman = key;
    } else {
        emitter(key);
        skk.roman = '';
    }
}

function romanInput(keyevent, table) {
    if (keyevent.key == 'return') {
        chrome.input.ime.commitText(skk.context, '\n');
        return;
    }
    if (keyevent.key.length != 1) {
        // special keys -- ignore for now
        return;
    }

    if (keyevent.key == 'q') {
        skk.switchMode(
            (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
	return;
    } else if (keyevent.shiftKey || keyevent.key == 'Q') {
        skk.switchMode('preedit');
        preeditInput(keyevent);
        return;
    } else if (keyevent.key == 'l') {
        skk.switchMode('ascii');
        return;
    } else if (keyevent.key == 'L') {
        skk.switchMode('full-ascii');
        return;
    }

    processRoman(keyevent.key, table, function(text) {
        chrome.input.ime.commitText(skk.context, text);
    });

    if (skk.roman.length > 0) {
        chrome.input.ime.setComposition(
            skk.context, skk.roman, null, null, skk.roman.length,
            [{start:0, end:skk.roman.length - 1, style:'underline'}]);
    } else {
        chrome.input.ime.clearComposition(skk.context);
    }
}

function preeditInput(keyevent) {
    if (keyevent.key == 'return') {
        chrome.input.ime.commitText(skk.context, skk.preedit);
        skk.switchMode('hiragana');
        return;
    }

    if (keyevent.key == 'escape') {
        skk.switchMode('hiragana');
    }

    if (keyevent.key.length != 1) {
        // special keys -- ignore for now
        return;
    }

    processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
        skk.preedit += text;
    });

    var preedit = '\u25bd' + skk.preedit + skk.roman;
    chrome.input.ime.setComposition(
        skk.context, preedit, null, null, preedit.length,
        [{start:0, end:preedit.length - 1, style:'underline'}]);
}

skk.registerMode('hiragana', function(keyevent) {
    romanInput(keyevent, romanTable);
});
skk.registerMode('katakana', function(keyevent) {
    romanInput(keyevent, katakanaTable);
});
skk.registerMode('preedit', preeditInput);
})() 
