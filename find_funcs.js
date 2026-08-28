const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Replace all decoder calls by executing the decoders and replacing calls with literal strings!
// First let's extract the decoder functions block
// The decoders are at the top of the file up until the main code starts

// Let's find where the decoders end
const vm = require('vm');
const ctx = vm.createContext({
  console: console,
  window: {},
  document: {}
});

// Run the declarations at the top
// Let's find the function names used to decode strings:
// Looking at the code: FYiinY, FdqJpQM, aZcidcq, Qgd7SOl, SWLYcEk, s1tpCf, qfiQA0
// Let's inspect all top-level functions

const regex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
let m;
const funcs = [];
while ((m = regex.exec(body.substring(0, 10000))) !== null) {
  funcs.push(m[1]);
}
console.log("Top functions found:", funcs);
