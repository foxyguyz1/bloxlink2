const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Notice in the code: yAHw1O is a function that returns a constructor or string or function
// Let's find how yAHw1O is implemented:
const start = body.indexOf('function yAHw1O');
console.log(body.substring(start, start + 1200));
