exports.userSettingsFile = './settings.json';
//exports.userSettingsFile = { "name": {"fullname":"Kristopher Redding", "nickname":"Kris"}, "voice":"off"};

exports.greetings = ["Hey", "Hello {0} how are things treating you", "I hope you are having a good day today"];

exports.app_apis = [
    {"name":"tasteKid", "link":"http://www.tastekid.com/api/","key":"228198-JadenPer-P426AN1R"},
    { "name":"openWeather", "link":"http://api.openweathermap.org/data/2.5/", "key":"90c2be179d4c18b392e3e11efa2ee5c1"}
];
/*
  PHRASE LIBRARY
  action: ACTION WORD
  response: RESPONSE FUNCTION
  additional_phrases: ADDITIONAL PHRASEING FOR SAME ACTION
  subactions: SUB ACTIONS UNDER SAME CATEGORY
*/
exports.phraseLibrary = [
  {"action": "test", "level":0, "response":"testCode"},
  {"action": "change", "level":0, "subactions":[{"action":"my", "level":1, "subactions":[{"action":"fullname", "level":1, "response":"changeFullName"}, {"action":"nickname", "level":1, "response":"changeNickname"},{"action":"voice", "level":1, "response":"changeVoice"}]}]},
  {"action": "hello", "level":0, "response":"greetings", "additional_phrases":["hi", "hey"]},
  {"action": "time", "level":1, "response":"getLocalTime", "subactions":[ {"action":"in", "response":"getTimeZoneTime"}]},
  {"action": "date", "level":1, "response":"getLocalDate", "subactions":[ {"action":"in", "response":"getTimeZoneDate"}]},
  {"action": "media", "level":1, "additional_phrases":["books", "music","movies","shows","games","authors"], "subactions":[ {"action":"similar", "level":1, "response":"getTastekidResults"} ]},
  {"action":"weather", "level":2, "response":"getWeatherCurrent", "subactions":[{"action":"forecast", "level":2, "response":"getWeatherForecast"}, {"action":"details", "level":1, "response":"getWeatherDetailedForecast"} ]},
  {"action": "image", "level":2, "subactions":[{"action":"facial", "level":1, "subactions":[{"action":"tracking", "level":1, "response":"imageFacialTracking"}]}]},
  {"action": "cpu", "level":10, "subactions":[{"action": "architecture", "level":10, "response":"getCpuArch", "additional_phrases":["arch"]}, {"action": "information", "level":10, "response":"getCpuInfo", "additional_phrases":["info"]}]},
  {"action": "computers", "level":10, "subactions":[ {"action":"hostname", "level":10, "response":"getComputerHostname"}]},
  {"action": "network", "level":10, "subactions":[ {"action":"interface", "level":10, "response":"getNetworkInterface"}]},
  {"action": "system", "level":10, "subactions":[{"action": "release", "level":10, "response":"getSystemRelease"}, {"action": "memory", "level":10, "response":"getSystemMemory"}]}
];
