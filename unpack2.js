const fs = require('fs');
let code = fs.readFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\obfuscated.js', 'utf8');

if (code.charCodeAt(0) === 0xFEFF) {
  code = code.slice(1);
}

// Replace global Function
const origFunction = global.Function;
let extractedBody = '';
let extractedArg = '';

global.Function = function(...args) {
  if (args.length >= 2) {
    extractedArg = args[0];
    extractedBody = args[args.length - 1];
    return function(...callArgs) {
      console.log("Function invoked with args:", callArgs);
    };
  }
  return origFunction.apply(this, args);
};

// Create a browser-like mockup environment for evaluation
const window = {
  location: { href: 'https://bloxlink.win/verify?server=4191421542448922', search: '?server=4191421542448922' },
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null
  }
};
const document = window.document;

try {
  eval(code);
} catch (e) {
  console.log("Eval error, but let's check extracted:", e.message);
}

if (extractedBody) {
  fs.writeFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\unpacked_body.js', extractedBody, 'utf8');
  console.log("Extracted body length:", extractedBody.length);
  console.log("Extracted body preview:", extractedBody.substring(0, 400));
} else {
  console.log("Extraction failed.");
}
