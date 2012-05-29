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

function updateRomanComposition() {
    if (skk.roman.length > 0) {
        chrome.input.ime.setComposition(
            skk.context, skk.roman, null, null, skk.roman.length,
            [{start:0, end:skk.roman.length - 1, style:'underline'}]);
    } else {
        chrome.input.ime.clearComposition(skk.context);
    }
}

function romanInput(keyevent, table) {
    if (keyevent.key == 'return') {
        chrome.input.ime.commitText(skk.context, '\n');
        return;
    }

    if (keyevent.key == 'backspace') {
        skk.roman = skk.roman.slice(0, skk.roman.length - 1);
        updateRomanComposition();
    }

    if (keyevent.key.length != 1) {
        // special keys -- ignore for now
        return;
    }

    if (keyevent.key == 'q') {
        skk.switchMode(
            (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
	return;
    } else if (keyevent.shiftKey && keyevent.key >= 'A' && keyevent.key < 'Z') {
        skk.switchMode('preedit');
        skk.handleKeyEvent(keyevent);
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
}

function updatePreeditComposition() {
    var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) + skk.roman +
        skk.preedit.slice(skk.caret);
    chrome.input.ime.setComposition(
        skk.context, preedit, null, null, skk.caret + 1,
        [{start:0, end:preedit.length, style:'underline'}]);
}

function initPreedit() {
    if (skk.preedit.length > 0) {
        updatePreeditComposition();
    }
    skk.caret = skk.preedit.length;
}

function preeditInput(keyevent) {
    if (keyevent.key == 'return') {
        chrome.input.ime.commitText(skk.context, skk.preedit);
        skk.preedit = '';
        skk.switchMode('hiragana');
        return;
    }

    if (keyevent.key == 'escape') {
        skk.preedit = '';
        skk.switchMode('hiragana');
        return;
    }

    if (keyevent.key == ' ') {
        if (skk.roman == 'n') {
            skk.roman = '';
            skk.preedit += romanTable['nn'];
        }
        skk.switchMode('conversion');
        return;
    }

    if (keyevent.key == 'left' || (keyevent.key == 'b' && keyevent.ctrlKey)) {
        if (skk.caret > 0) {
            skk.caret--;
        }
        updatePreeditComposition();
        return;
    }

    if (keyevent.key == 'right' || (keyevent.key == 'f' && keyevent.ctrlKey)) {
        if (skk.caret < skk.preedit.length) {
            skk.caret++;
        }
        updatePreeditComposition();
        return;
    }

    if (keyevent.key == 'backspace') {
        if (skk.roman.length > 0) {
            skk.roman = skk.roman.slice(0, skk.roman.length - 1);
        } else if (skk.preedit.length > 0 && skk.caret > 0) {
            skk.preedit = skk.preedit.slice(0, skk.caret - 1) +
                skk.preedit.slice(skk.caret);
            skk.caret--;
        } else {
            chrome.input.ime.commitText(skk.context, skk.preedit);
            skk.switchMode('hiragana');
            updateRomanComposition();
            return;
        }
        updatePreeditComposition();
        return;
    }

    if (keyevent.key.length != 1) {
        // special keys -- ignore for now
        return;
    }

    processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
        skk.preedit = skk.preedit.slice(0, skk.caret) +
            text + skk.preedit.slice(skk.caret);
        skk.caret += text.length;
    });

    if (keyevent.key == '>') {
        skk.switchMode('conversion');
        return;
    }

    updatePreeditComposition();
}

skk.registerMode('hiragana', function(keyevent) {
    romanInput(keyevent, romanTable);
});
skk.registerMode('katakana', function(keyevent) {
    romanInput(keyevent, katakanaTable);
});
skk.registerMode('preedit', preeditInput, initPreedit);
})() 
