function SKK(engineID, dictionary) {
  this.engineID = engineID;
  this.context = null;
  this.currentMode = 'hiragana';
  this.previousMode = null;
  this.roman = '';
  this.preedit = '';
  this.okuriPrefix = '';
  this.okuriText = '';
  this.caret = null;
  this.entries = null;
  this.dictionary = dictionary;
}

SKK.prototype.commitText = function(text) {
  chrome.input.ime.commitText({contextID:this.context, text:text});
};

SKK.prototype.setComposition = function(text, cursor, args) {
  var allowed_fields = ['selectionStart', 'selectionEnd'];
  var obj = {
    contextID:this.context,
    text:text,
    cursor:cursor};
  args = args || {};
  for (var i = 0; i < allowed_fields.length; i++) {
    var field = allowed_fields[i];
    if (args[field]) {
      obj[field] = args[field];
    }
  }
  chrome.input.ime.setComposition(obj);
};

SKK.prototype.clearComposition = function() {
  chrome.input.ime.clearComposition({contextID:this.context});
};

SKK.prototype.updateCandidates = function() {
  if (this.inner_skk) {
    this.inner_skk.updateCandidates();
    return;
  }

  if (!this.entries || this.entries.index <= 2) {
    chrome.input.ime.setCandidateWindowProperties({
      engineID:this.engineID,
      properties:{
        visible:false
      }});
  } else {
    chrome.input.ime.setCandidateWindowProperties({
      engineID:this.engineID,
      properties:{
      visible:true,
      cursorVisible:false,
      vertical:true,
      pageSize:7
    }});
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
    chrome.input.ime.setCandidates({
      contextID:this.context, candidates:candidates});
  }
};

SKK.prototype.lookup = function(reading, callback) {
  var result = this.dictionary.lookup(reading);
  if (result) {
    callback(result.data);
  } else {
    callback(null);
  }
};

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

  var roman = this.roman + key;
  if (table[roman]) {
    this.roman = '';
    emitter(table[roman]);
    return true;
  }

  if (roman.length > 1 && roman[0] == roman[1]) {
    this.roman = roman.slice(1);
    emitter(table['xtu']);
  }

  if (isStarting(roman, table)) {
    this.roman = roman;
    return true;
  }

  if (roman[0] == 'n') {
    emitter(table['nn']);
  }

  if (table[key]) {
    this.roman = '';
    emitter(table[key]);
    return true;
  } else if (isStarting(key, table)) {
    this.roman = key;
    return true;
  } else {
    this.roman = '';
    return false;
  }
};

SKK.prototype.modes = {};
SKK.prototype.primaryModes = [];
SKK.registerMode = function(modeName, mode) {
  SKK.registerImplicitMode(modeName, mode);
  SKK.prototype.primaryModes.push(modeName);
};
SKK.registerImplicitMode = function(modeName, mode) {
  SKK.prototype.modes[modeName] = mode;
};

SKK.prototype.switchMode = function(newMode) {
  if (newMode == this.currentMode) {
    // already switched.
    return;
  }

  if (this.inner_skk) {
    this.inner_skk.switchMode(newMode);
    return;
  }

  this.previousMode = this.currentMode;
  this.currentMode = newMode;
  var initHandler = this.modes[this.currentMode].initHandler;
  if (initHandler) {
    initHandler(this);
  }

  if (this.primaryModes.indexOf(this.previousMode) >= 0 &&
      this.primaryModes.indexOf(this.currentMode) >= 0) {
    chrome.input.ime.updateMenuItems({
      engineID:this.engineID,
      items:[
        {id:'skk-' + this.previousMode,
         label:this.modes[this.previousMode].displayName,
         style:'radio',
         checked:false},
        {id:'skk-' + this.currentMode,
         label:this.modes[this.currentMode].displayName,
         style:'radio',
         checked:true}
      ]});
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
    this.clearComposition();
  }
};

SKK.prototype.handleKeyEvent = function(keyevent) {
  // Do not handle modifier only keyevent.
  if (keyevent.key.charCodeAt(0) == 0xFFFD) {
    return false;
  }

  var consumed = false;
  if (this.inner_skk) {
    consumed = this.inner_skk.handleKeyEvent(keyevent);
  } else {
    var keyHandler = this.modes[this.currentMode].keyHandler;
    if (keyHandler) {
      consumed = keyHandler(this, keyevent);
    }
  }

  this.updateComposition();
  this.updateCandidates();
  return consumed;
};

SKK.prototype.createInnerSKK = function() {
  var outer_skk = this;
  var inner_skk = new SKK(this.engineID, this.dictionary);
  inner_skk.commit_text = '';
  inner_skk.commit_cursor = 0;
  inner_skk.commitText = function(text) {
    inner_skk.commit_text =
      inner_skk.commit_text.slice(0, inner_skk.commit_cursor) +
      text + inner_skk.commit_text.slice(inner_skk.commit_cursor);
    inner_skk.commit_cursor += text.length;
  };

  inner_skk.getPrefix = function() {
    var prefix_text = '\u25bc' + outer_skk.preedit;
    if (outer_skk.okuriText.length > 0) {
      prefix_text += '*' + outer_skk.okuriText;
    }

    var cursor = outer_skk.preedit.length + 2 + inner_skk.commit_cursor;
    if (outer_skk.okuriText.length > 0) {
      cursor += outer_skk.okuriText.length + 1;
    }
    return {text:prefix_text + '\u3010' + this.commit_text, cursor:cursor};
  };

  inner_skk.setComposition = function(text, cursor, args) {
    var prefix = this.getPrefix();
    if (args && args.selectionStart) {
      args.selectionStart += prefix.text.length;
    }
    if (args && args.selectionEnd) {
      args.selectionEnd += prefix.text.length;
    }
    outer_skk.setComposition(
      prefix.text + text + '\u3011', prefix.cursor, args);
  };
  inner_skk.clearComposition = function() {
    var prefix = this.getPrefix();
    outer_skk.setComposition(prefix.text + '\u3011', prefix.cursor);
  };

  var original_handler = SKK.prototype.handleKeyEvent.bind(inner_skk);
  inner_skk.handleKeyEvent = function(keyevent) {
    if (original_handler(keyevent)) {
      return true;
    }

    if (keyevent.key == 'Right' ||
        (keyevent.key == 'f' && keyevent.ctrlKey)) {
      if (inner_skk.commit_cursor < inner_skk.commit_text.length) {
        inner_skk.commit_cursor++;
      }
    } else if (keyevent.key == 'Left' ||
               (keyevent.key == 'b' && keyevent.ctrlKey)) {
      if (inner_skk.commit_cursor > 0) {
        inner_skk.commit_cursor--;
      }
    } else if (keyevent.key == 'Backspace') {
      if (inner_skk.commit_text == '') {
        outer_skk.finishInner(false);
      } else if (inner_skk.commit_cursor > 0) {
        inner_skk.commit_text =
          inner_skk.commit_text.slice(0, inner_skk.commit_cursor - 1) +
          inner_skk.commit_text.slice(inner_skk.commit_cursor);
        inner_skk.commit_cursor--;
      }
    } else if (keyevent.key == 'Enter') {
      outer_skk.finishInner(true);
    } else if (keyevent.key == 'Esc' ||
        (keyevent.key == 'g' && keyevent.ctrlKey)) {
      outer_skk.finishInner(false);
    }

    return true;
  };

  outer_skk.inner_skk = inner_skk;
};

SKK.prototype.recordNewResult = function(entry) {
  this.dictionary.recordNewResult(this.preedit + this.okuriPrefix, entry);
};

SKK.prototype.finishInner = function(successfully) {
  if (successfully && this.inner_skk.commit_text.length > 0) {
    var new_word = this.inner_skk.commit_text;
    this.recordNewResult({word:new_word});
    this.commitText(new_word + this.okuriText);
  }

  this.inner_skk = null;
  this.roman = '';

  if (successfully) {
    this.entries = null;
    this.preedit = '';
    this.okuriText = '';
    this.okuriPrefix = '';
    this.switchMode('hiragana');
  } else {
    if (this.previousMode != 'conversion') {
      this.entries = null;
    }
    if (this.previousMode == 'okuri-preedit') {
      this.preedit += this.okuriText;
      this.previousMode = 'preedit';
    }
    this.okuriText = '';
    this.okuriPrefix = '';
    this.switchMode(this.previousMode);
  }
};
