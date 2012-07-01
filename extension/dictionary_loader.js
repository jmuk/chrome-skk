function Dictionary(dictionary_name) {
  this.userDict = {};
  this.systemDict = {};
  this.initSystemDictionary(dictionary_name);
}

(function() {
var dictionary_filename = 'SKK-JISYO.L.gz';

function parseData(data) {
  // Not serious impl -- just check 'concat' function.
  function evalSexp(word) {
    if (word.indexOf('(concat ') != 0 || word[word.length - 1] != ')') {
      return word;
    }

    var result = '';
    var in_str = false;
    for (var i = ('(concat ').length; i < word.length; i++) {
      var c = word[i];
      if (c == '"') {
        in_str = !in_str;
        continue;
      }
      if (!in_str) {
        continue;
      }
      if (c == '\\') {
        result += String.fromCharCode(
          parseInt(word.slice(i + 1, i + 4), 8));
        i += 3;
      } else {
        result += c;
      }
    }
    return result;
  }

  function parseEntry(entry) {
    var semicolon = entry.indexOf(';');
    var result = {};
    if (semicolon < 0) {
      result.word = evalSexp(entry);
    } else {
      result.word = evalSexp(entry.slice(0, semicolon));
      result.annotation = evalSexp(entry.slice(semicolon + 1));
    }
    return result;
  }

  var lines = data.split('\n');
  var total = lines.length;
  var result = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line[0] == ';') {
      continue;
    }
    var space_pos = line.indexOf(' ');
    var reading = line.slice(0, space_pos);
    var entries_string = line.slice(space_pos + 1).split('/');
    var entries = [];
    for (var j = 0; j < entries_string.length; j++) {
      if (entries_string[j].length > 0) {
        entries.push(parseEntry(entries_string[j]));
      }
    }
    result[reading] = entries;
  }
  return result;
}

Dictionary.prototype.doUpdate = function(fs) {
  var self = this;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://skk-dict-mirror.appspot.com/' + dictionary_filename);
  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) {
      return;
    }

    self.systemDict = parseData(xhr.responseText);
    fs.root.getFile(
      'system-dictionary.json', {create:true}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function(e) {
            var dict_size = 0;
            for (var w in self.systemDict) dict_size++;
            console.log(
              {'type':'update_status', 'percent':100, 'words':dict_size});
            };
            var blob = new Blob([JSON.stringify(self.systemDict)],
                                {'type': 'text/plain'});
            fileWriter.write(blob);
          });
        });
    };
  xhr.send();
};

Dictionary.prototype.syncUserDictionary = function() {
  var self = this;
  function onInitFS(fs) {
    fs.root.getFile('user-dictionary.json', {create:true}, function(fileEntry) {
      fileEntry.createWriter(function(fileWriter) {
        var blob = new Blob([JSON.stringify(self.userDict)],
                            {'type': 'text/plain'});
        fileWriter.write(blob);
      });
    });
  }
  var request = window.requestFileSystem || window.webkitRequestFileSystem;
  request(self.TEMPORARY, 50 * 1024 * 1024, onInitFS);
};

Dictionary.prototype.initSystemDictionary = function(dict_name) {
  if (dict_name) {
    dictionary_filename = dict_name;
  }

  var self = this;
  function onInitFS(fs) {
    fs.root.getFile('system-dictionary.json', {}, function(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          self.systemDict = JSON.parse(reader.result);
          var dict_size = 0;
          for (var w in self.systemDict) dict_size++;
          console.log({type:'update_status',
                       message: 'loaded_from_file',
                       dict_size: dict_size,
                       percent:100});
        };
        reader.onerror = function(e) { doUpdate(fs); };
        reader.readAsText(file);
      }, function() { doUpdate(fs); });
    }, function() { doUpdate(fs); });
    fs.root.getFile('user-dictionary.json', {}, function(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          this.userDict = JSON.parse(reader.result);
        };
        reader.readAsText(file);
      });
    });
  }

  var request = window.requestFileSystem || window.webkitRequestFileSystem;
  request(self.TEMPORARY, 50 * 1024 * 1024, onInitFS);
};

Dictionary.prototype.lookup = function(reading) {
  var entries = [];
  var userEntries = this.userDict[reading] || [];
  var systemEntries = this.systemDict[reading] || [];
  var word_set = {};
  for (var i = 0; i < userEntries.length; i++) {
    if (!word_set[systemEntries[i].word]) {
      entries.push(userEntries[i]);
      word_set[userEntries[i].word] = true;
    }
  }
  for (var i = 0; i < systemEntries.length; i++) {
    if (!word_set[systemEntries[i].word]) {
      word_set[systemEntries[i].word] = true;
      entries.push(systemEntries[i]);
    }
  }

  if (entries.length > 0) {
    return {reading:reading, data:entries};
  } else {
    return null;
  }
};

Dictionary.prototype.recordNewResult = function(reading, newEntry) {
  var entries = this.lookup(reading);

  // Not necessary to modify the user dictionary if it's already the top.
  if (entries && entries.data[0].word == newEntry.word) {
    return;
  }

  var userEntries = this.userDict[reading];
  if (userEntries == null) {
    this.userDict[reading] = [newEntry];
  } else {
    var existing_i = -1;
    for (var i = 0; i < userEntries.length; i++) {
      if (userEntries[i].word == newEntry.word) {
        existing_i = i;
        break;
      }
    }
    if (existing_i >= 0) {
      this.userDict[reading].splice(existing_i, 1);
    }
    this.userDict[reading].unshift(newEntry);
  }

  this.syncUserDictionary();
};

})();
