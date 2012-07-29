var romanTable = {
  a:'\u3042', i:'\u3044', u:'\u3046', e:'\u3048', o:'\u304a',
  xa:'\u3041', xi:'\u3043', xu:'\u3045', xe:'\u3047', xo:'\u3049',
  ca:'\u304b', ci:'\u304d', cu:'\u304f', ce:'\u3051', co:'\u3053',
  ka:'\u304b', ki:'\u304d', ku:'\u304f', ke:'\u3051', ko:'\u3053',
  ga:'\u304c', gi:'\u304e', gu:'\u3050', ge:'\u3052', go:'\u3054',
  sa:'\u3055', si:'\u3057', su:'\u3059', se:'\u305b', so:'\u305d',
  za:'\u3056', zi:'\u3058', zu:'\u305a', ze:'\u305c', zo:'\u305e',
  ta:'\u305f', ti:'\u3061', tu:'\u3064', te:'\u3066', to:'\u3068',
  tsa:'\u3064\u3041', tsi:'\u3064\u3043', tsu:'\u3064', tse:'\u3064\u3047', tso:'\u3064\u3049',
  da:'\u3060', di:'\u3062', du:'\u3065', de:'\u3067', do:'\u3069',
  na:'\u306a', ni:'\u306b', nu:'\u306c', ne:'\u306d', no:'\u306e',
  ha:'\u306f', hi:'\u3072', hu:'\u3075', he:'\u3078', ho:'\u307b',
  ba:'\u3070', bi:'\u3073', bu:'\u3076', be:'\u3079', bo:'\u307c',
  pa:'\u3071', pi:'\u3074', pu:'\u3077', pe:'\u307a', po:'\u307d',
  ma:'\u307e', mi:'\u307f', mu:'\u3080', me:'\u3081', mo:'\u3082',
  ya:'\u3084', yi:'\u3044', yu:'\u3086', ye:'\u3044\u3047', yo:'\u3088',
  ra:'\u3089', ri:'\u308a', ru:'\u308b', re:'\u308c', ro:'\u308d',
  wa:'\u308f', wi:'\u3046\u3043', wu:'\u3046', we:'\u3046\u3047', wo:'\u3092',
  va:'\u3094\u3041', vi:'\u3094\u3043', vu:'\u3094\u3045', ve:'\u3094\u3047', vo:'\u3094\u3049',
  fa:'\u3075\u3041', fi:'\u3075\u3043', fu:'\u3075', fe:'\u3075\u3047', fo:'\u3075\u3049',

  xtu:'\u3063', nn:'\u3093',

  ',':'\u3001', '.':'\u3002', '[':'\uff62', ']':'\uff63', ' ':'\u3000',
  '-':'\u30fc', ' ': '\u3000',

  'z.': '\u2026', 'z,': '\u2025', 'z/': '\u30fb', 'z-':'\u301c', 'zh': '\u2190','zj': '\u2193', 'zk': '\u2191', 'zl': '\u2192'
};

var katakanaTable = {};

(function() {
function initRomanTable() {
  var youons = ['c', 'k', 's', 't', 'n', 'h', 'm', 'r', 'g', 'd', 'b', 'p', 'z'];
  function addYouon(youon, prefix, base) {
    var mapping = {a:'\u3083', i:'\u3043', u:'\u3085',
                   e:'\u3047', o:'\u3087'};
    for (var sound in mapping) {
      var youon_char = mapping[sound];
      romanTable[youon + prefix + sound] = base + youon_char;
    }
  }
  for (var i = 0; i < youons.length; i++) {
    addYouon(youons[i], 'y', romanTable[youons[i] + 'i']);
  }

  addYouon('x', 'y', '');
  addYouon('t', 'h', romanTable['te']);
  addYouon('d', 'h', romanTable['de']);
  addYouon('s', 'h', romanTable['si']);
  addYouon('c', 'h', romanTable['ti']);
  addYouon('j', '',  romanTable['zi']);

  // special case: shi==si, chi==ti, ji=zi
  romanTable['shi'] = romanTable['si'];
  romanTable['chi'] = romanTable['ti'];
  romanTable['ji'] = romanTable['zi'];

  for (var key in romanTable) {
    var hiragana = romanTable[key];
    var katakana = '';
    for (var i = 0; i < hiragana.length; i++) {
      var c = hiragana.charCodeAt(i);
      if (c > 0x3040 && c < 0x30a0) {
        katakana += String.fromCharCode(c + 0x60);
      } else {
        katakana += String.fromCharCode(c);
      }
    }
    katakanaTable[key] = katakana;
  }
}

window.addEventListener('load', initRomanTable);
})();
