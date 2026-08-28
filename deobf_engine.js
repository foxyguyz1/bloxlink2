const fs = require('fs');
const vm = require('vm');

let raw = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\obfuscated.js', 'utf8');

// Let's hook the JS Function constructor and eval inside the script to capture all strings evaluated or functions created
let createdFunctions = [];

const trackedWin = {
  fetch: (url, opts) => {
    console.log(">>> [FETCH DETECTED]", url, opts);
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  }
};

// Let's replace strings by decompiling or intercepting the string lookup table!
// Notice how in unpacked_body.js we saw the top-level string table `i3ikX0_` and decoder `qfiQA0`
// Let's write a parser that replaces every call to s1tpCf(idx) or _Co4xa(idx) with the evaluated string!

