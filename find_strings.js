const fs = require('fs');

// Let's hook the string decoder function in the unpacked body to dump all decoded strings!
let body = fs.readFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\unpacked_body.js', 'utf8');

// Let's find all function declarations at the top
const vm = require('vm');
const decodedStrings = new Set();

// Let's create an environment where we instrument the decoder functions
// The decoder functions are identified earlier: FdqJpQM, qfiQA0, etc.
// Let's inspect the entire file for string decoders and wrap them

console.log("Searching for string table definitions...");
