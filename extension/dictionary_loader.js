var initSystemDictionary = null;
var lookupDictionary = null;

var systemDict = {};
(function() {
var dictionary_filename = 'SKK-JISYO.L.gz';

var userDict = {};

function doesDictionaryNeedUpdate(fs) {
    /*
    function checkEtag(prev_etag) {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', server + dictionary_filename);
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) {
                return;
            }
            var etag = xhr.getResponseHeader('ETag');
            if (!etag || (etag != prev_etag)) {
                doUpdate(fs);
            }
        };
        xhr.send();;
    };

    fs.root.getFile('system-dictionary-etag.txt', {}, function(fileEntry) {
        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                prev_etag = reader.result;
                checkEtag(prev_etag);
            }
            reader.onerror = function() { doUpdate(fs); };
            reader.readAsText(file);
        }, function() { doUpdate(fs); });
    }, function() {
        doUpdate(fs);
    });
    */
};

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
    var tic = total / 100;
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

        if (i == tic) {
            console.log({'type': 'update_status', 'percent':i / total});
            tic += total / 100;
        }
    }
    return result;
}

function doUpdate(fs) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/' + dictionary_filename);
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
            return;
        }

        systemDict = parseData(xhr.responseText);
        fs.root.getFile(
            'system-dictionary.json', {create:true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function(e) {
                        console.log(
                            {'type':'update_status', 'percent':100});
                    };
                    var bb = new WebKitBlobBuilder();
                    bb.append(JSON.stringify(systemDict));
                    fileWriter.write(bb.getBlob('text/plain'));
                });
            });
    };
    xhr.send();
}

initSystemDictionary = function(dict_name) {
    if (dict_name) {
        dictionary_filename = dict_name;
    }

    function onInitFS(fs) {
        fs.root.getFile('system-dictionary.json', {}, function(fileEntry) {
            fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                    systemDict = JSON.parse(reader.result);
                    console.log({type:'update_status',
                                 message: 'loaded_from_file',
                                 percent:100});
                    // doesDictionaryNeedUpdate(fs);
                };
                reader.onerror = function(e) { doUpdate(fs); };
                reader.readAsText(file);
            }, function() { doUpdate(fs); });
        }, function() { doUpdate(fs); });
    }

    var request = self.requestFileSystem || self.webkitRequestFileSystem;
    request(self.TEMPORARY, 50 * 1024 * 1024, onInitFS);
};

lookupDictionary = function (reading) {
    console.log(reading);
    var entries = systemDict[reading];
    console.log(entries);
    if (entries) {
        return {reading:reading, data:entries};
    } else {
        return null;
    }
};
})()
