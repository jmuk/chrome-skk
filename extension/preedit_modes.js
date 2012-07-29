(function() {
function updateComposition(skk) {
  var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) + skk.roman +
    skk.preedit.slice(skk.caret);
  var caret = skk.caret + skk.roman.length + 1;
  skk.setComposition(preedit, caret);
}

function initPreedit(skk) {
  skk.caret = skk.preedit.length;
}

function preeditKeybind(skk, keyevent) {
  if (keyevent.key == 'Enter' || (keyevent.key == 'j' && keyevent.ctrlKey)) {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Esc' || (keyevent.key == 'g' && keyevent.ctrlKey)) {
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Left' || (keyevent.key == 'b' && keyevent.ctrlKey)) {
    if (skk.caret > 0) {
      skk.caret--;
    }
    return true;
  }

  if (keyevent.key == 'Right' || (keyevent.key == 'f' && keyevent.ctrlKey)) {
    if (skk.caret < skk.preedit.length) {
      skk.caret++;
    }
    return true;
  }

  if (keyevent.key == 'Backspace') {
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
    }
    return true;
  }

  if (keyevent.key == 'q') {
    skk.commitText(kanaTurnOver(skk.preedit));
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }
  return false;
}

function preeditInput(skk, keyevent) {
  if (keyevent.key == ' ') {
    if (skk.roman == 'n') {
      skk.preedit += romanTable['nn'];
    }
    skk.roman = '';
    skk.switchMode('conversion');
    return true;
  }

  if (preeditKeybind(skk, keyevent)) {
    return true;
  }

  if (keyevent.key.length != 1) {
    // special keys -- ignore for now
    return false;
  }

  if (skk.preedit.length > 0 &&
      keyevent.shiftKey && 'A' <= keyevent.key && keyevent.key <= 'Z') {
    var key = keyevent.key.toLowerCase();
    if (key == 'c') {
      key = 'k';
    }
    var okuriPrefix = (skk.roman.length > 0) ? skk.roman[0] : key;
    skk.processRoman(key, romanTable, function(text) {
        if (skk.roman.length > 0) {
          skk.preedit += text;
          skk.caret += text.length;
        } else {
          skk.okuriPrefix = okuriPrefix;
          skk.okuriText = text;
          skk.switchMode('conversion');
        }
      });
    if (skk.currentMode == 'preedit') {
      // We should re-calculate the okuriPrefix since the 'roman' can be
      // changed during processRoman -- such like 'KanJi' pattern.
      skk.okuriPrefix = (skk.roman.length > 0) ? skk.roman[0] : key;
      skk.switchMode('okuri-preedit');
    }
    return true;
  }

  var processed = skk.processRoman(keyevent.key.toLowerCase(), romanTable,
                                   function(text) {
      skk.preedit = skk.preedit.slice(0, skk.caret) +
        text + skk.preedit.slice(skk.caret);
      skk.caret += text.length;
    });

  if (skk.preedit.length > 0 && keyevent.key == '>') {
    skk.roman = '';
    skk.preedit += '>';
    skk.switchMode('conversion');
  } else if (!processed) {
    console.log(keyevent);
    skk.preedit = skk.preedit.slice(0, skk.caret) +
      keyevent.key + skk.preedit.slice(skk.caret);
    skk.caret += keyevent.key.length;
  }
  return true;
}

function updateOkuriComposition(skk) {
  var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) +
    '*' + skk.okuriText + skk.roman + skk.preedit.slice(skk.caret);
  var caret = skk.caret + skk.roman.length + 2;
  skk.setComposition(preedit, caret);
}

function okuriPreeditInput(skk, keyevent) {
  if (keyevent.key == 'Enter') {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Esc' || (keyevent.key == 'g' && keyevent.ctrlKey)) {
    skk.preedit = '';
    skk.roman = '';
    skk.okuriPrefix = '';
    skk.okuriText = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Backspace') {
    skk.roman = skk.roman.slice(0, skk.roman.length - 1);
    if (skk.roman.length == 0) {
      skk.okuriPrefix = '';
      skk.roman = '';
      skk.switchMode('preedit');
      return true;
    }
  }

  skk.processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
    skk.okuriText += text;
    if (skk.roman.length == 0) {
      skk.switchMode('conversion');
    }
  });
  return true;
}

function asciiPreeditInput(skk, keyevent) {
  if (keyevent.key == ' ') {
    skk.switchMode('conversion');
    return true;
  }

  if (preeditKeybind(skk, keyevent)) {
    return true;
  }

  if (keyevent.key.length != 1) {
    return true;
  }

  skk.preedit += keyevent.key;
  skk.caret++;
  return true;
}

SKK.registerImplicitMode('preedit', {
  keyHandler: preeditInput,
  compositionHandler: updateComposition,
  initHandler: initPreedit
});

SKK.registerImplicitMode('okuri-preedit', {
  keyHandler: okuriPreeditInput,
  compositionHandler: updateOkuriComposition
});

SKK.registerImplicitMode('ascii-preedit', {
  keyHandler: asciiPreeditInput,
  compositionHandler: updateComposition,
  initHandler: initPreedit
});

function kanaTurnOver(str) {
  var turnedOverStr = '';
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c > 0x3040 && c < 0x3097) {
      turnedOverStr += String.fromCharCode(c + 0x60);
    } else if (c > 0x30a0 && c < 0x30f7) {
      turnedOverStr += String.fromCharCode(c - 0x60);
    } else {
      turnedOverStr += String.fromCharCode(c);
    }
  }
  return turnedOverStr;
}
})();
