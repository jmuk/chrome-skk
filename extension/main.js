(function() {
var skk;
var dictionary = new Dictionary();

chrome.input.ime.onActivate.addListener(function(engineID) {
  skk = new SKK(engineID, dictionary);
  var menus = [];
  for (var i = 0; i <skk.primaryModes.length; i++) {
    var modeName = skk.primaryModes[i];
    menus.push({id:'skk-' + modeName,
                label:skk.modes[modeName].displayName,
                style:'radio',
                checked:(modeName == 'hiragana')});
  }
  chrome.input.ime.setMenuItems({engineID:engineID, items:menus});
});

chrome.input.ime.onFocus.addListener(function(context) {
  skk.context = context.contextID;
});

chrome.input.ime.onKeyEvent.addListener(function(engineID, keyData) {
  if (keyData.type != 'keydown') {
    return false;
  }

  return skk.handleKeyEvent(keyData);
});

chrome.input.ime.onMenuItemActivated.addListener(function(engineID, name) {
  var modeName = name.slice('skk-'.length);
  skk.switchMode(modeName);
});
})();
