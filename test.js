import json from './index.js'

//Testing
var obj = json.parse('{"text": "text", "ab" : -1.2e+2,"key":[123, "123", {}, {"key": null, "key2": false}]}');
//var tok = scan('{}');
//var tok = scan('[{}, "abc"]');
//console.log(tok);

//var obj = evaluate(tok);
console.log(obj);

//console.log(Object.entries(obj));
var str = json.generate(obj);
console.log(str);