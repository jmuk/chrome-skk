(function() {
var roman = '';

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
    roman += key;
    if (table[roman]) {
	emitter(table[roman]);
	roman = '';
	return;
    }

    if (roman.length > 1 && roman[0] == roman[1]) {
	emitter(table['xtu']);
	roman = roman.slice(1);
    }

    if (isStarting(roman, table)) {
	return;
    }

    if (roman[0] == 'n') {
	emitter(table['nn']);
    }

    if (table[key]) {
	emitter(table[key]);
	roman = '';
    } else if (isStarting(key, table)) {
	roman = key;
    } else {
	emitter(key);
	roman = '';
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

    if (keyevent.key.toLowerCase() == 'q') {
	skk.switchMode(
	    (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
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

    if (roman.length > 0) {
	chrome.input.ime.setComposition(
	    skk.context, roman, null, null, roman.length,
	    [{start:0, end:roman.length - 1, style:'underline'}]);
    } else {
	chrome.input.ime.clearComposition(skk.context);
    }
}

skk.registerMode('hiragana', function(keyevent) {
    romanInput(keyevent, romanTable);
});
skk.registerMode('katakana', function(keyevent) {
    romanInput(keyevent, katakanaTable);
});

})()
		 
