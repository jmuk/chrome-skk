(function() {
function createAsciiLikeMode(conv) {
  return function(skk, keyevent) {
    if (keyevent.ctrlKey && keyevent.key == 'j') {
      skk.switchMode('hiragana');
      return;
    }

    if (keyevent.key == 'Return') {
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
  displayName: '\u82f1\u6570',
  keyHandler: createAsciiLikeMode(function(c) { return c; })
});

SKK.registerMode('full-ascii', {
  displayName: '\u5168\u82f1',
  keyHandler: createAsciiLikeMode(function(c) {
    return String.fromCharCode(c.charCodeAt(0) + 0xfee0);
  })
});
})();
