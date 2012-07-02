var dictionary_suffixes = ['S', 'M', 'ML', 'L', 'L.unannotated', 'assoc',
                           'china_taiwan', 'edict', 'fullname', 'geo',
                           'itaiji', 'jinmei', 'law', 'mazegaki', 'okinawa',
                           'propernoun'];

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
  form.onchange = function() {
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) {
        bgPage.skk_dictionary.dictionary_name = inputs[i].value;
        bgPage.skk_dictionary.reloadSystemDictionary();
      }
    }
  };

  document.getElementById('reload_button').onclick = function() {
    bgPage.skk_dictionary.reloadSystemDictionary();
  };
}

window.addEventListener('load', onload);