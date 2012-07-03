var dictionary_suffixes = ['S', 'M', 'ML', 'L', 'L.unannotated', 'assoc',
                           'china_taiwan', 'edict', 'fullname', 'geo',
                           'itaiji', 'jinmei', 'law', 'mazegaki', 'okinawa',
                           'propernoun'];

function logger(obj) {
  var div = document.getElementById('reloading_message');
  div.innerHTML = '';
  if (obj.status == 'written') {
    div.style.display = 'none';
    document.getElementById('system_dictionary_values').disabled = '';
    document.getElementById('reload_button').disabled = '';
    return;
  }

  div.style.display = 'block';
  div.appendChild(document.createTextNode(obj.status));
  if (obj.status == 'parsing') {
    div.appendChild(
      document.createTextNode(': ' + obj.progress + '/' + obj.total));
  }
}

function onload() {
  var bgPage = chrome.extension.getBackgroundPage();
  var current_system_dictionary = bgPage.skk_dictionary.dictionary_name;
  var form = document.getElementById('system_dictionary_values');
  var ul = document.createElement('ul');
  var inputs = [];
  for (var i = 0; i < dictionary_suffixes.length; i++) {
    var suffix = dictionary_suffixes[i];
    var dict_name = 'SKK-JISYO.' + suffix + '.gz';
    var li = document.createElement('li');
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = 'system-dictionary';
    input.value = dict_name;
    if (dict_name == current_system_dictionary) {
      input.checked = 'checked';
    }
    input.id = 'system-dictionary-' + dict_name;
    li.appendChild(input);
    inputs.push(input);

    var label = document.createElement('label');
    label.htmlFor = input.id;
    label.appendChild(document.createTextNode(dict_name));
    li.appendChild(label);
    ul.appendChild(li);
  }

  form.appendChild(ul);

  var reload_button = document.getElementById('reload_button');

  form.onchange = function() {
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) {
        bgPage.skk_dictionary.setSystemDictionaryName(inputs[i].value);
        form.disabled = 'disabled';
        reload_button.disabled = 'disabled';
        bgPage.skk_dictionary.reloadSystemDictionary(logger);
      }
    }
  };

  document.getElementById('reload_button').onclick = function() {
    form.disabled = 'disabled';
    reload_button.disabled = 'disabled';
    bgPage.skk_dictionary.reloadSystemDictionary(logger);
  };
}

window.addEventListener('load', onload);