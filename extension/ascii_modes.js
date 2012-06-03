(function() {
function createAsciiLikeMode(conv) {
  return function(skk, keyevent) {
    if (keyevent.ctrlKey && keyevent.key == 'j') {
      skk.switchMode('hiragana');
      return;
    }

    if (keyevent.key == 'return') {
      skk.commitText('\n');
      return;
    }

    if (keyevent.key.length > 1 ||
        keyevent.altKey || keyevent.ctrlKey) {
      skk.sendKeyEvent(keyevent);
      return;
    }

    skk.commitText(conv(keyevent.key));
  };
}

SKK.registerMode('ascii', {
  keyHandler: createAsciiLikeMode(function(c) { return c; })
});

SKK.registerMode('full-ascii', {
  keyHandler: createAsciiLikeMode(function(c) {
    return String.fromCharCode(c.charCodeAt(0) + 0xfee0);
  })
});
})();
