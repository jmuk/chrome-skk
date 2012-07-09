var chrome = {};
(function() {
function setComposition (obj) {
  var text = obj.text;
  var selectionStart = obj.selectionStart;
  var selectionEnd = obj.selectionEnd;
  var cursor = obj.cursor;
  var segments = obj.segments || [];
  var composition = document.getElementById('ime-composition');
  composition.innerHTML = '';
  if (text.length == 0) {
    return;
  }
  if ((!selectionStart) || (!selectionEnd) || (selectionEnd < selectionStart)) {
    selectionStart = -1;
    selectionEnd = -1;
  }

  if (cursor && cursor >= 0 && cursor <= text.length) {
    document.getElementById('result').style.borderRight = 'none';
  } else {
    document.getElementById('result').style.borderRight = 'solid 1px';
  }

  var segment_index = 0;
  var span = null;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    var segment = segments[segment_index] || {start:-1, end:-1};
    if (i == cursor || i == selectionStart || i == segment.start) {
      span = document.createElement('span');
      if (i == cursor) {
	span.style.borderLeft = 'solid 1px';
      }
      if (i >= selectionStart && i < selectionEnd) {
	span.style.backgroundColor = 'skyblue';
      }
      if (i >= segment.start && i < segment.end) {
	span.style.textDecoration = 'underline';
      }
      span.appendChild(document.createTextNode(c));
      composition.appendChild(span);
    } else if ((!span) || (i == selectionEnd) || (i == segment.end)) {
      span = document.createElement('span');
      span.appendChild(document.createTextNode(c));
      composition.appendChild(span);
      if (i == (segment.end + 1)) {
	segment_index++;
      }
    } else {
      span.firstChild.textContent += c;
    }
  }

  if (cursor == text.length) {
    composition.lastChild.style.borderRight = 'solid 1px';
  }
}

function clearComposition(obj) {
  document.getElementById('ime-composition').innerHTML = '';
  document.getElementById('result').style.borderRight = 'solid 1px';
}

function commitText (obj) {
  var text = obj.text;
  var segments = [];
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (c == ' ') {
      segments.push(document.createTextNode('\u00A0'));
    } else if (c == '\n') {
      segments.push(document.createElement('br'));
    } else {
      segments.push(c);
    }
  }

  var result = document.getElementById('result');
  for (var i = 0; i < segments.length;) {
    if (typeof(segments[i]) != 'string') {
      result.appendChild(segments[i]);
      i++;
      continue;
    }

    for (var j = i + 1;
         j < segments.length && typeof(segments[j]) == 'string'; j++) {
    }
    result.appendChild(document.createTextNode(segments.slice(i, j).join('')));
    i = j;
  }
}

var kDefaultCandidateWindowPageSize = 10;
var candidateWindowProperty = {
  cursorVisible: false,
  vertical: false,
  pageSize: kDefaultCandidateWindowPageSize
};

function setCandidateWindowProperties(obj) {
  var properties = obj.properties;
  document.getElementById('candidate-window').style.display =
    properties.visible ? 'block' : 'none';
  candidateWindowProperty.cursorVisible = properties.cursorVisible;
  candidateWindowProperty.vertical = properties.vertical;
  candidateWindowProperty.pageSize =
    properties.pageSize || kDefaultCandidateWindowPageSize;
  if (properties.auxiliaryTextVisible && properties.auxiliaryText.length > 0) {
    var aux_text = document.getElementById('aux-text');
    aux_text.style.display = 'block';
    aux_text.innerHTML = '';
    aux_text.appendChild(document.createTextNode(properties.auxiliaryText));
  } else {
    document.getElementById('aux-text').style.display = 'none';
  }
}

function setCandidates(obj) {
  var candidates = obj.candidates;
  var parent = document.getElementById('candidates');
  parent.innerHTML = '';
  for (var i = 0; i < candidates.length && i < candidateWindowProperty.pageSize;
       i++) {
    var candidate = candidates[i];
    var tr = document.createElement('tr');
    tr.id = 'candidate-' + candidate.id;
    var c1 = document.createElement('td');
    if (candidate.label) {
      c1.appendChild(document.createTextNode(candidate.label));
    }
    tr.appendChild(c1);
    var c2 = document.createElement('td');
    c2.appendChild(document.createTextNode(candidate.candidate));
    tr.appendChild(c2);
    var c3 = document.createElement('td');
    if (candidate.annotation) {
      c3.appendChild(document.createTextNode(candidate.annotation));
    }
    tr.appendChild(c3);

    tr.onclick = function(ev) {
      var target = ev.target;
      while (target.nodeName != "TR") {
	target = target.parentNode;
      }
      var id = Number(target.id.slice('candidate-'.length));
      chrome.input.onCandidateClicked.emit(mockEngineId, id, 'left');
    };
    parent.appendChild(tr);
  }
}

function createMenuItem(menuItem, group_name, targetDiv) {
  if (menuItem.style == 'radio') {
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = group_name;
    input.value = menuItem.id;
    input.id = 'menu-item-input-' +menuItem.id;
    if (menuItem.checked) {
      input.checked = 'checked';
    }
    if (('enabled' in menuItem) && !menuItem.enabled) {
      input.disabled = 'disabled';
    }
    targetDiv.appendChild(input);
    input.onchange = function(e) {
      chrome.input.ime.onMenuItemActivated.emit(
        mockEngineId, e.target.value);
    };

    var label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = menuItem.label;
    targetDiv.appendChild(label);
  } else {
    targetDiv.textContent = menuItem.label;
    targetDiv.id = 'menu-item-content-' + menuItem.id;
    targetDiv.onclick = function() {
      chrome.input.ime.onMenuItemActivated.emit(
        mockEngineId, e.target.id.slice('menu-item-content-'.length));
    };
  }
}

function setMenuItems(obj) {
  var menuItems = obj.items;
  var itemsDiv = document.getElementById('menu-items');
  itemsDiv.innerHTML = '';
  var radio_group_id = 0;
  for (var i = 0; i < menuItems.length; i++) {
    if (menuItems[i].style == 'none') {
      // do nothing.
    } else if (menuItems[i].style == 'separator') {
      itemsDiv.appendChild(document.createElement('hr'));
      radio_group_id++;
    } else {
      var item = document.createElement('div');
      createMenuItem(menuItems[i], 'menu-item-group-' + radio_group_id, item);
      item.id = 'menu-item-' + menuItems[i].id;
      itemsDiv.appendChild(item);
    }
  }
}

function updateMenuItems(obj) {
  var items = (obj.items instanceof Array) ? obj.items : [obj.items];

  for (var i = 0; i < items.length; i++) {
    var item = document.getElementById('menu-item-' + items[i].id);
    if (('visible' in items[i]) && !items[i].visible) {
      item.style.visibility = 'hidden';
      continue;
    } else {
      item.style.visibility = 'visible';
    }
    var inputs = item.getElementsByTagName('input');
    var group_name = '';
    if (inputs.length > 0) {
      group_name = inputs[0].name;
    }
    item.innerHTML = '';
    createMenuItem(items[i], group_name, item);
  }
}

function NotImplemented(obj, callback) {
  console.log("NotImplemented");
  if (callback) {
    callback(false);
  }
}

function Callbacker(func) {
  return function(obj, callback) {
    func(obj);
    if (callback) {
      callback(true);
    }
  };
}

function EventListener() {
  this.listeners_ = [];
}

EventListener.prototype.addListener = function(f) {
  this.listeners_.push(f);
};

EventListener.prototype.emit = function() {
  for (var i = 0; i < this.listeners_.length; i++) {
    this.listeners_[i].apply(this, arguments);
  }
};

chrome['input'] = {
  ime: {
    setComposition: Callbacker(setComposition),
    clearComposition: Callbacker(clearComposition),
    commitText: Callbacker(commitText),
    setCandidateWindowProperties: Callbacker(setCandidateWindowProperties),
    setCandidates: Callbacker(setCandidates),
    setCursorPosition: NotImplemented,
    setMenuItems: Callbacker(setMenuItems),
    updateMenuItems: Callbacker(updateMenuItems),
    sendKeyEvent: NotImplemented,
    onActivate: (new EventListener()),
    onDeactivated: (new EventListener()),
    onFocus: (new EventListener()),
    onBlur: (new EventListener()),
    onInputContextUpdate: (new EventListener()),
    onKeyEvent: (new EventListener()),
    onCandidateClicked: (new EventListener()),
    onMenuItemActivated: (new EventListener())
  }
};

var mockEngineId = 'sample';
var mockContext = {
  textID: 0,
  type: 'Text'
};

window.addEventListener('load', function() {
  document.getElementById('result').style.borderRight = 'solid 1px';
  chrome.input.ime.onActivate.emit(mockEngineId);
  chrome.input.ime.onFocus.emit(mockEngineId, mockContext);
});

function emitKeyEvent(ev) {
  // rented from http://www.selfcontained.us/2009/09/16/getting-keycode-values-in-javascript/
  // and keyname from http://src.chromium.org/viewvc/chrome/trunk/src/chrome/browser/chromeos/input_method/ibus_keymap.cc?view=markup
  var keyMap = {
    8:"Backspace", 9:"Tab", 13:"Enter", 16:"\uFFFD", 17:"\uFFFD", 18:"\uFFFD",
    27:"Esc", 32:" ", 33:"PageUp", 34:"PageDown", 35:"End", 36:"Home",
    37:"Left", 38:"Up", 39:"Right", 40:"Down", 43:"+", 46:"Delete",
    48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7", 56:"8",
    57:"9", 59:";", 61:"=", 65:"a", 66:"b", 67:"c", 68:"d", 69:"e", 70:"f",
    71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n", 79:"o",
    80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w", 88:"x",
    89:"y", 90:"z", 96:"0", 97:"1", 98:"2", 99:"3", 100:"4", 101:"5",
    102:"6", 103:"7", 104:"8", 105:"9", 106: "*", 107:"+", 109:"-",
    110:".", 111: "/", 112:"HistoryBack", 113:"HistoryForward",
    114:"BrowserRefresh", 115:"ChromeOSFullscreen", 116:"ChromeOSSwitchWindow",
    117:"BrightnessDown", 118:"BrightnessUp", 119:"AudioVolumeMute",
    120:"AudioVolumeDown", 121:"AudioVolumeUp", 186:";", 187:"=", 188:",",
    189:"-", 190:".", 191:"/", 192:"`", 219:"[",  220:"\\", 221:"]", 222:"'"
  };
  var shiftKeyMap = {
    16:"\uFFFD", 192:"~", 48:")", 49:"!", 50:"@", 51:"#", 52:"$", 53:"%",
    54:"^", 55:"&", 56:"*", 57:"(", 109:"_", 61:"+", 219:"{", 221:"}",
    220:"|", 59:":", 222:"\"", 187:"+", 188:"<", 189:"_", 190:">", 191:"?",
    192: '~'
  };

  var key = (ev.shiftKey) ?
    (shiftKeyMap[ev.keyCode] || keyMap[ev.keyCode].toUpperCase()) :
    keyMap[ev.keyCode];
  if (key == null) {
    return;
  }
  var keyEvent = {
    type: ev.type,
    key: key,
    shiftKey: ev.shiftKey,
    ctrlKey: ev.ctrlKey,
    altKey: ev.altKey
  };
  chrome.input.ime.onKeyEvent.emit(mockEngineId, keyEvent);
}

window.addEventListener('load', function() {
  var div = document.createElement('div');
  div.style.outline = '0';
  div.contentEditable = true;
  div.style.position = 'absolute';
  div.style.top = '-9999px';
  div.style.left = '-9999px';
  document.body.appendChild(div);
  div.focus();
  div.onkeydown = function(ev) {
    emitKeyEvent(ev);
    return false;
  };
  div.onkeyup = function(ev) {
    emitKeyEvent(ev);
    return false;
  };
  div.onblur = function(ev) {
    div.focus();
  };
});
})();
