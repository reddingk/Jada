exports.greetings = ["Hey", "Hello Kris how are things treating you", "I hope you are having a good day today"];

exports.app_apis = [
    {"name":"tasteKid", "link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"},
    { "name":"openweather", "link":"http://api.openweathermap.org/data/2.5/" "key":"90c2be179d4c18b392e3e11efa2ee5c1"}
];
/*
  PHRASE LIBRARY
  action: ACTION WORD
  response: RESPONSE FUNCTION
  additional_phrases: ADDITIONAL PHRASEING FOR SAME ACTION
  subactions: SUB ACTIONS UNDER SAME CATEGORY
*/
exports.phraseLibrary = [
  {"action": "hello", "level":0, "response":"greetings", "additional_phrases":["hi", "hey"]},
  {"action": "time", "level":1, "response":"getLocalTime", "subactions":[ {"action":"in", "response":"getTimeZoneTime"}]},
  {"action": "date", "level":1, "response":"getLocalDate", "subactions":[ {"action":"in", "response":"getTimeZoneDate"}]},
  {"action": "media", "level":1, "additional_phrases":["books", "music","movies","shows","games","authors"], "subactions":[ {"action":"similar", "level":1, "response":"getTastekidResults"} ]}

];
