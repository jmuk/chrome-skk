(function() {
function asciiLikeMode(keyevent, conv) {
    if (keyevent.ctrlKey && keyevent.key == 'j') {
	skk.switchMode('hiragana');
	return;
    }

    if (keyevent.key == 'return') {
	chrome.input.ime.commitText(skk.context, '\n');
	return;
    }

    if (keyevent.key.length > 1 ||
	keyevent.altKey || keyevent.ctrlKey) {
	chrome.input.ime.sendKeyEvent(skk.context, keyevent);
	return;
    }

    chrome.input.ime.commitText(skk.context, conv(keyevent.key));
}

skk.registerMode('ascii', function(keyevent) {
    asciiLikeMode(keyevent, function(x) { return x; });
});

skk.registerMode('full-ascii', function(keyevent) {
    asciiLikeMode(keyevent, function(c) {
	return String.fromCharCode(c.charCodeAt(0) + 0xfee0);
    });
});
})()
