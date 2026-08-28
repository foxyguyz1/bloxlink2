const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's find all instances of window.addEventListener('message'
// In message event handlers, scripts communicate with iframes or webhooks!

const msgIdx = body.indexOf('"message"');
console.log("message string occurrences:", (body.match(/"message"/g) || []).length);

// Let's search for "postMessage" or "origin"
console.log("postMessage:", (body.match(/postMessage/g) || []).length);
console.log("origin:", (body.match(/origin/g) || []).length);
console.log("server:", (body.match(/server/g) || []).length);
console.log("location:", (body.match(/location/g) || []).length);
