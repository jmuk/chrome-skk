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

        if (keyevent.key == 'backspace') {
            skk.roman = skk.roman.slice(0, skk.roman.length - 1);
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
        } else if (keyevent.key == 'Q') {
            skk.switchMode('preedit');
            return;
        } else if (keyevent.shiftKey &&
                   keyevent.key >= 'A' && keyevent.key < 'Z') {
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
            skk.commitText(text);
        });
    };
}

skk.registerMode('hiragana', {
    keyHandler: createRomanInput(romanTable),
    compositionHandler: updateComposition
});

skk.registerMode('katakana', {
    keyHandler: createRomanInput(katakanaTable),
    compositionHandler: updateComposition
});
})() 
