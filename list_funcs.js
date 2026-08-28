const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Notice: function FYiinY(){FYiinY=function(){}} is hoisted in JS!
// But notice that SWLYcEk, aZcidcq, Qgd7SOl etc. are also functions.
// Let's find all function declarations in the file!

const regex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
let m;
const funcs = [];
while ((m = regex.exec(body)) !== null) {
  funcs.push({ name: m[1], pos: m.index });
}
console.log("All function declarations in file:", funcs);
