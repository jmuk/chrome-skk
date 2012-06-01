(function() {
function updateComposition(skk) {
    if (skk.roman.length > 0) {
        skk.setComposition(
            skk.roman, null, null, skk.roman.length,
            [{start:0, end:skk.roman.length - 1, style:'underline'}]);
    } else {
        skk.clearComposition();
    }
}

function createRomanInput(table) {
    return function (skk, keyevent) {
        if (keyevent.key == 'return') {
            skk.commitText('\n');
            return;
        }

        if (keyevent.key == 'backspace' && skk.roman.length > 0) {
            skk.roman = skk.roman.slice(0, skk.roman.length - 1);
            return;
        }

        if (keyevent.key.length != 1) {
	    skk.sendKeyEvent(keyevent);
            return;
        }

        if (keyevent.key == 'q') {
            skk.roman = '';
            skk.switchMode(
                (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
	    return;
        } else if (keyevent.key == 'Q') {
            skk.roman = '';
            skk.switchMode('preedit');
            return;
        } else if (keyevent.key == 'l') {
            skk.roman = '';
            skk.switchMode('ascii');
            return;
        } else if (keyevent.key == 'L') {
            skk.roman = '';
            skk.switchMode('full-ascii');
            return;
        } else if (keyevent.key == '/') {
            skk.roman = '';
            skk.switchMode('ascii-preedit');
            return;
        } else if (keyevent.shiftKey &&
                   keyevent.key >= 'A' && keyevent.key < 'Z') {
            skk.switchMode('preedit');
            skk.processRoman(
                keyevent.key.toLowerCase(), romanTable, function(text) {
                    skk.preedit = skk.preedit.slice(0, skk.caret) +
                        text + skk.preedit.slice(skk.caret);
                    skk.caret += text.length;
                });
            return;
        }

        skk.processRoman(keyevent.key, table, function(text) {
            skk.commitText(text);
        });
    };
}

SKK.registerMode('hiragana', {
    keyHandler: createRomanInput(romanTable),
    compositionHandler: updateComposition
});

SKK.registerMode('katakana', {
    keyHandler: createRomanInput(katakanaTable),
    compositionHandler: updateComposition
});
})() 
