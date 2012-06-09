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

function preeditKeybind(skk, keyevent) {
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

  return false;
}

function preeditInput(skk, keyevent) {
  if (keyevent.key == ' ') {
    if (skk.roman == 'n') {
      skk.preedit += romanTable['nn'];
    }
    skk.roman = '';
    skk.switchMode('conversion');
    return;
  }

  if (preeditKeybind(skk, keyevent)) {
    return;
  }

  if (keyevent.key.length != 1) {
    // special keys -- ignore for now
    return;
  }

  if (keyevent.shiftKey && 'A' <= keyevent.key && keyevent.key <= 'Z') {
    skk.okuriPrefix =
      (skk.roman.length > 0) ? skk.roman[0] : keyevent.key.toLowerCase();
    skk.processRoman(
      keyevent.key.toLowerCase(), romanTable, function(text) {
        skk.okuriText = text;
        skk.switchMode('conversion');
      });
    if (skk.currentMode == 'preedit') {
      skk.switchMode('okuri-preedit');
    }
    return;
  }

  skk.processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
    skk.preedit = skk.preedit.slice(0, skk.caret) +
      text + skk.preedit.slice(skk.caret);
    skk.caret += text.length;
  });

  if (keyevent.key == '>') {
    skk.roman = '';
    skk.switchMode('conversion');
    return;
  }
}

function updateOkuriComposition(skk) {
  var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) +
    '*' + skk.roman + skk.preedit.slice(skk.caret);
  var caret = skk.caret + skk.roman.length + 2;
  skk.setComposition(preedit, null, null, caret,
    [{start:0, end:preedit.length, style:'underline'}]);
}

function okuriPreeditInput(skk, keyevent) {
  if (keyevent.key == 'Enter') {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return;
  }

  if (keyevent.key == 'Esc') {
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return;
  }

  if (keyevent.key == 'Backspace') {
    skk.roman = skk.roman.slice(0, skk.roman.length - 1);
    if (skk.roman.length == 0) {
      skk.okuriPrefix = '';
      skk.roman = '';
      skk.switchMode('preedit');
      return;
    }
  }

  skk.processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
    skk.okuriText = text;
    skk.switchMode('conversion');
  });
}

function asciiPreeditInput(skk, keyevent) {
  if (keyevent.key == ' ') {
    skk.switchMode('conversion');
  }

  if (preeditKeybind(skk, keyevent)) {
    return;
  }

  if (keyevent.key.length != 1) {
    return;
  }

  skk.preedit += keyevent.key;
  skk.caret++;
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
})();
