const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's find all URLs, paths, domain strings in unpacked_body.js or decode them by evaluating all function scopes!
// Notice: in JS-obfuscator / Hikari / Obfuscator.io, every scope defines its own string decoder mapping.
// Let's find all blocks matching `function [a-zA-Z0-9_$]+\([^)]*\)\s*\{[^}]*return\s+[a-zA-Z0-9_$]+\(i3ikX0_`

const regex = /function\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{[^}]*qfiQA0\([^)]*\)[^}]*\}/g;
console.log("Matches:", body.match(regex));
