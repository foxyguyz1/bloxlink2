const fs = require('fs');
let code = fs.readFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\obfuscated.js', 'utf8');

// The code starts with Function("oYvLcP", "...")(...)
// Let's extract the function body string and evaluate/inspect its structure
try {
  // If it's Function("arg", "body")(argVal), let's inspect the body
  console.log("Starts with:", code.substring(0, 50));
  console.log("Ends with:", code.substring(code.length - 100));
} catch (e) {
  console.error(e);
}
