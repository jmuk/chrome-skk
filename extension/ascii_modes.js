(function() {
function createAsciiLikeMode(conv) {
  return function(skk, keyevent) {
    if (keyevent.ctrlKey && keyevent.key == 'j') {
      skk.switchMode('hiragana');
      return true;
    }

    if (keyevent.key == 'Return') {
      skk.commitText('\n');
      return true;
    }

    if (keyevent.key.length > 1 ||
        keyevent.altKey || keyevent.ctrlKey) {
      return false;
    }

    return conv(skk, keyevent.key);
  };
}

SKK.registerMode('ascii', {
  displayName: '\u82f1\u6570',
  keyHandler: createAsciiLikeMode(function(skk, key) {
    return false;
  })
});

SKK.registerMode('full-ascii', {
  displayName: '\u5168\u82f1',
  keyHandler: createAsciiLikeMode(function(skk, key) {
    var c = key.charCodeAt(0);
    if (c >= 0x20 && c < 0x7f) {
      skk.commitText(String.fromCharCode(c + 0xfee0));
      return true;
    }
    return false;
  })
});
})();
