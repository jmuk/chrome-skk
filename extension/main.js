var skk_dictionary =new Dictionary();
var skk = null;

(function() {
chrome.input.ime.onActivate.addListener(function(engineID) {
  skk = new SKK(engineID, skk_dictionary);
  var menus = [{id:'skk-options',
                label:'SKK\u306E\u8A2D\u5B9A',
                style:'check'
               },
               {id:'skk-separator', style:'separator'}];
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
  if (name == 'skk-options') {
    window.open(chrome.extension.getURL('options.html'));
    return;
  }

  var modeName = name.slice('skk-'.length);
  skk.switchMode(modeName);
});
})();
