(function() {
var skk;

chrome.input.ime.onActivate.addListener(function(engineId) {
  skk = new SKK(engineId);
  skk.initDictionary();
  var menus = [];
  for (var i = 0; i <skk.primaryModes.length; i++) {
    var modeName = skk.primaryModes[i];
    menus.push({id:'skk-' + modeName,
                label:skk.modes[modeName].displayName,
                style:'radio',
                checked:(modeName == 'hiragana')});
  }
  chrome.input.ime.setMenuItems({engineId:engineId, items:menus});
});

chrome.input.ime.onFocus.addListener(function(engineId, ctx) {
  skk.context = ctx;
});

chrome.input.ime.onKeyEvent.addListener(function(engineId, keyevent) {
  if (keyevent.type != 'keydown') {
    return false;
  }

  return skk.handleKeyEvent(keyevent);
});

chrome.input.ime.onMenuItemActivated.addListener(function(engineId, name) {
  var modeName = name.slice('skk-'.length);
  skk.switchMode(modeName);
});
})();
