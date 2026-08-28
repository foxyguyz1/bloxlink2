const fs = require('fs');
let code = fs.readFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\obfuscated.js', 'utf8');

// Strip UTF8 BOM if present
if (code.charCodeAt(0) === 0xFEFF) {
  code = code.slice(1);
}

// Function constructor has the form: Function(arg1, body)(val)
// Let's hook Function or evaluate it in a sandbox / intercept its execution or unpack it
// In JavaScript: new Function('arg', 'body') creates a function.
// Let's replace the outer Function constructor to return the body string!

let bodyStr = null;
const customFunction = function(...args) {
  if (args.length === 2) {
    bodyStr = args[1];
    return function() {};
  }
  return Function(...args);
};

// Evaluate the wrapper
eval('(' + code.replace(/^Function\(/, 'customFunction('));

if (bodyStr) {
  fs.writeFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\unpacked_body.js', bodyStr, 'utf8');
  console.log("Successfully unpacked inner body! Length:", bodyStr.length);
  console.log("First 300 chars:", bodyStr.substring(0, 300));
} else {
  console.log("Could not unpack via hook.");
}
