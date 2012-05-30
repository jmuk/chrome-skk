(function() {
function updateComposition(skk) {
    var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) + skk.roman +
        skk.preedit.slice(skk.caret);
    var caret = skk.caret + skk.roman.length + 1;
    skk.setComposition(preedit, null, null, caret,
		       [{start:0, end:preedit.length, style:'underline'}]);
}

function initPreedit(skk) {
    skk.caret = skk.preedit.length;
}

function preeditInput(skk, keyevent) {
    if (keyevent.key == 'return') {
        skk.commitText(skk.preedit);
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
        return;
    }

    if (keyevent.key == 'right' || (keyevent.key == 'f' && keyevent.ctrlKey)) {
        if (skk.caret < skk.preedit.length) {
            skk.caret++;
        }
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
            skk.commitText(skk.preedit);
	    skk.preedit = '';
            skk.switchMode('hiragana');
            return;
        }
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
}

skk.registerMode('preedit', {
    keyHandler: preeditInput,
    compositionHandler: updateComposition,
    initHandler: initPreedit
});
})()
