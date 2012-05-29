var chrome = {};
(function() {
function setComposition (
    ctx, text, selectionStart, selectionEnd, cursor, segments, callback) {
    var composition = document.getElementById('ime-composition');
    composition.innerHTML = '';
    if (text.length == 0) {
	return;
    }
    if ((!selectionStart) || (!selectionEnd) ||
	(selectionEnd < selectionStart)) {
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
	} else if ((!span) || (i == selectionEnd) ||
		   (i == segment.end)) {
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

    if (callback) {
	callback(true);
    }
}

function clearComposition(ctx, callback) {
    document.getElementById('ime-composition').innerHTML = '';
    document.getElementById('result').style.borderRight = 'solid 1px';
    if (callback) {
	callback(true);
    }
}

function commitText (ctx, text, callback) {
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
	result.appendChild(document.createTextNode(
	    segments.slice(i, j).join('')));
	i = j;
    }

    if (callback) {
	callback(true);
    }
}

function NotImplemented() {
    console.log("NotImplemented");
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
	setComposition: setComposition,
	clearComposition: clearComposition,
	commitText: commitText,
	setCandidateWindowProperties: NotImplemented,
	setCandidates: NotImplemented,
	setCursorPosition: NotImplemented,
	setMenuItems: NotImplemented,
	updateMenuItems: NotImplemented,
	sendKeyEvent: NotImplemented,
	onActivate: (new EventListener()),
	onDeactivate: (new EventListener()),
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
    var keyMap = {
        8:"backspace", 9:"tab", 13:"return", 16:"shift", 17:"ctrl", 18:"alt",
	19:"pausebreak", 20:"capslock", 27:"escape", 32:" ", 33:"pageup",
        34:"pagedown", 35:"end", 36:"home", 37:"left", 38:"up", 39:"right",
	40:"down", 43:"+", 44:"printscreen", 45:"insert", 46:"delete",
        48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7", 56:"8",
	57:"9", 59:";", 61:"=", 65:"a", 66:"b", 67:"c", 68:"d", 69:"e", 70:"f",
	71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n", 79:"o",
	80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w", 88:"x",
	89:"y", 90:"z", 96:"0", 97:"1", 98:"2", 99:"3", 100:"4", 101:"5",
	102:"6", 103:"7", 104:"8", 105:"9", 106: "*", 107:"+", 109:"-",
	110:".", 111: "/", 112:"f1", 113:"f2", 114:"f3", 115:"f4", 116:"f5",
	117:"f6", 118:"f7", 119:"f8", 120:"f9", 121:"f10", 122:"f11", 123:"f12",
	144:"numlock", 145:"scrolllock", 186:";", 187:"=", 188:",", 189:"-",
	190:".", 191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"'"
    };
    var shiftKeyMap = {
        192:"~", 48:")", 49:"!", 50:"@", 51:"#", 52:"$", 53:"%", 54:"^",
	55:"&", 56:"*", 57:"(", 109:"_", 61:"+", 219:"{", 221:"}", 220:"|",
	59:":", 222:"\"", 187:"+", 188:"<", 189:"_", 190:">", 191:"?", 192: '~',
    };

    var key = (ev.shiftKey) ?
	(shiftKeyMap[ev.keyCode] || keyMap[ev.keyCode].toUpperCase()) :
	keyMap[ev.keyCode];
    if (!key) {
	return;
    }
    if (key == 'SHIFT') {
	key = 'shift';
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
});

for (var i = 0; i < srcs.length; i++) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = srcs[i];
    document.head.appendChild(script);
}
})()
