function SKK(engineId) {
    this.engineId = engineId;
    this.context = null;
    this.currentMode = 'hiragana'
    this.previousMode = null;
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
    if (this.internal_skk) {
        this.internal_skk.updateCandidates();
        return;
    }

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
    } else {
        callback(null);
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
    this.previousMode = this.currentMode;
    this.currentMode = newMode;
    var initHandler = this.modes[this.currentMode].initHandler;
    if (initHandler) {
        initHandler(this);
    }
};

SKK.prototype.updateComposition = function() {
    if (this.inner_skk) {
        this.inner_skk.updateComposition();
        return;
    }

    var compositionHandler = this.modes[this.currentMode].compositionHandler;
    if (compositionHandler) {
        compositionHandler(this);
    } else {
        chrome.input.ime.clearComposition(this.context);
    }
}

SKK.prototype.handleKeyEvent = function(keyevent) {
    // Do not handle modifier only keyevent.
    if (keyevent.key == 'shift' || keyevent.key == 'ctrl' ||
        keyevent.key == 'alt') {
        return;
    }

    if (this.inner_skk) {
        this.inner_skk.handleKeyEvent(keyevent);
    } else {
        var keyHandler = this.modes[this.currentMode].keyHandler;
        if (keyHandler) {
            keyHandler(this, keyevent);
        }
    }

    this.updateComposition();
    this.updateCandidates();
};

SKK.prototype.createInnerSKK = function() {
    var outer_skk = this;
    var inner_skk = new SKK(this.engineId);
    inner_skk.commit_text = '';
    inner_skk.commit_caret = 0;
    inner_skk.commitText = function(text) {
        if (text == '\n') {
            outer_skk.finishInner(true);
            return;
        }

        inner_skk.commit_text =
            inner_skk.commit_text.slice(0, inner_skk.commit_caret) +
            text + inner_skk.commit_text.slice(inner_skk.commit_caret);
        inner_skk.commit_caret += text.length;
    };

    inner_skk.setComposition = function(
        text, selectionStart, selectionEnd, caret, segments) {
        var prefix = '\u25bc' + outer_skk.preedit + '\u3010' +
            inner_skk.commit_text;
        selectionStart += prefix.length;
        selectionEnd += prefix.length;
        caret += outer_skk.preedit.length + 2 + inner_skk.commit_caret;
        var real_segments = [{start:0, end:prefix.length, style:'underline'}];
        for (var i = 0; i < segments.length; i++) {
            real_segments.push({
                start:segments[i].start + prefix.length,
                end:segments[i].start + prefix.length,
                style:segments[i].style
            });
        }
        outer_skk.setComposition(
            prefix + text + '\u3011', selectionStart, selectionEnd, caret,
            segments);
    };
    inner_skk.clearComposition = function() {
        var text = '\u25bc' + outer_skk.preedit + '\u3010' +
            inner_skk.commit_text + '\u3011';
        var caret = outer_skk.preedit.length + 2 + inner_skk.commit_caret;
        var segments = [{start:0, end:text.length, style:'underline'}];
        outer_skk.setComposition(text, null, null, caret, segments);
    };
    inner_skk.sendKeyEvent = function(keyevent) {
        if (keyevent.key == 'right' ||
            (keyevent.key == 'f' && keyevent.ctrlKey)) {
            if (inner_skk.commit_caret < inner_skk.commit_text.length) {
                inner_skk.commit_caret++;
            }
        } else if (keyevent.key == 'left' ||
                   (keyevent.key == 'b' && keyevent.ctrlKey)) {
            if (inner_skk.commit_caret > 0) {
                inner_skk.commit_caret--;
            }
        } else if (keyevent.key == 'backspace') {
            if (inner_skk.commit_caret > 0) {
                inner_skk.commit_text =
                    inner_skk.commit_text.slice(0, inner_skk.commit_caret - 1) +
                    inner_skk.commit_text.slice(inner_skk.commit_caret);
                inner_skk.commit_caret--;
            }
        }
        if (keyevent.key == 'escape' ||
            (keyevent.key == 'g' && keyevent.ctrlKey)) {
            outer_skk.finishInner(false);
        }
    };

    outer_skk.inner_skk = inner_skk;
};

SKK.prototype.finishInner = function(successfully) {
    if (successfully && this.inner_skk.commit_text.length > 0) {
        var new_word = this.inner_skk.commit_text;
        recordNewResult(this.preedit + this.okuriPrefix, {word:new_word});
        this.commitText(new_word + this.okuriText);
    }

    this.inner_skk = null;
    this.roman = '';
    this.okuriText = '';
    this.okuriPrefix = '';

    if (successfully) {
        this.preedit = '';
        this.switchMode('hiragana');
    } else {
        this.switchMode(this.previousMode);
    }
};
