const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's find all function calls to qfiQA0 and s1tpCf and see what they return
// We can execute the setup part in VM:
const vm = require('vm');
const ctx = vm.createContext({
  console: console,
  window: {},
  document: {}
});

// Let's find the header part up to the end of decoder function definitions
const headerEnd = body.indexOf('function FdqJpQM');
// Let's find where s1tpCf ends
const s1End = body.indexOf(';', body.indexOf('function s1tpCf') + 500);

console.log("Header sample:", body.substring(0, 500));
console.log("s1tpCf sample:", body.substring(body.indexOf('function s1tpCf'), body.indexOf('function s1tpCf') + 300));
