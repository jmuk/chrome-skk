function SKK(engineId) {
    this.engineId = engineId;
    this.context = null;
    this.currentMode = 'hiragana'
    this.roman = ''
    this.preedit = ''
    this.okuriPrefix = ''
    this.okuriText = ''
    this.caret = null
    this.entries = null
}

SKK.prototype.commitText = function(text) {
    chrome.input.ime.commitText(this.context, text);
};

SKK.prototype.setComposition = function(
    text, selectionStart, selectionEnd, caret, segments) {
    chrome.input.ime.setComposition(
        this.context, text, selectionStart, selectionEnd, caret, segments);
}

SKK.prototype.clearComposition = function() {
    chrome.input.ime.clearComposition(this.context);
}

SKK.prototype.sendKeyEvent = function(keyevent) {
    chrome.input.ime.sendKeyEvent(this.context, keyevent);
}

SKK.prototype.updateCandidates = function() {
    if (!this.entries || this.entries.index <= 2) {
        chrome.input.ime.setCandidateWindowProperties(this.engineId, {
            visible:false
        });
    } else {
        chrome.input.ime.setCandidateWindowProperties(this.engineId, {
            visible:true,
            cursorVisible:false,
            vertical:true,
            pageSize:7
        });
        var candidates = [];
        for (var i = 0; i < 7; i++) {
            if (i + this.entries.index >= this.entries.entries.length) {
                break;
            }
            var entry = this.entries.entries[this.entries.index + i];
            candidates.push({
                candidate:entry.word,
                id:this.entries.index + i,
                label:"asdfjkl"[i],
                annotation:this.entries.annotation
            });
        }
        chrome.input.ime.setCandidates(this.context, candidates);
    }
}

SKK.prototype.initDictionary = function() {
    initSystemDictionary('SKK-JISYO.L.gz');
};

SKK.prototype.lookup = function(reading, callback) {
    result = lookupDictionary(reading);
    if (result) {
        callback(result.data);
    }
}

SKK.prototype.processRoman = function (key, table, emitter) {
    function isStarting(key) {
	var starting = false;
	for (var k in table) {
	    if (k.indexOf(key) == 0) {
		starting = true;
	    }
	}
	return starting;
    }

    this.roman += key;
    if (table[this.roman]) {
        emitter(table[this.roman]);
        this.roman = '';
        return;
    }

    if (this.roman.length > 1 && this.roman[0] == this.roman[1]) {
        emitter(table['xtu']);
        this.roman = this.roman.slice(1);
    }

    if (isStarting(this.roman, table)) {
        return;
    }

    if (this.roman[0] == 'n') {
        emitter(table['nn']);
    }

    if (table[key]) {
        emitter(table[key]);
        this.roman = '';
    } else if (isStarting(key, table)) {
        this.roman = key;
    } else {
        emitter(key);
        this.roman = '';
    }
};

SKK.prototype.modes = {}
SKK.registerMode = function(modeName, mode) {
    SKK.prototype.modes[modeName] = mode;
};

SKK.prototype.switchMode = function(newMode) {
    this.currentMode = newMode;
    var initHandler = this.modes[this.currentMode].initHandler;
    if (initHandler) {
        initHandler(this);
    }
};

SKK.prototype.handleKeyEvent = function(keyevent) {
    var keyHandler = this.modes[this.currentMode].keyHandler;
    if (keyHandler) {
        keyHandler(this, keyevent);
    }

    // currentMode may be changed during keyHandler, so we need to re-lookup
    // the modes here.
    var compositionHandler = this.modes[this.currentMode].compositionHandler;
    if (compositionHandler) {
        compositionHandler(this);
    } else {
        chrome.input.ime.clearComposition(this.context);
    }

    this.updateCandidates();
}
