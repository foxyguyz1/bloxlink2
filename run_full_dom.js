const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Notice: SWLYcEk checks A8_tRW (which is TextDecoder), _Co4xa (Uint8Array), mZI4dkD (Buffer).
// In Node.js or browser, TextDecoder and Uint8Array exist!
// Let's write a script that runs the entire obfuscated code with a proper mock of:
// - TextDecoder, TextEncoder, Uint8Array, Buffer
// - WebSocket, EventSource, fetch, XMLHttpRequest
// - HTML elements with standard prototype chain
// - location, history, URLSearchParams

const vm = require('vm');

const requests = [];

function makeElement(tag, id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    value: 'testUser',
    innerText: '',
    innerHTML: '',
    children: [],
    attributes: {},
    setAttribute(k, v) {
      this.attributes[k] = v;
      requests.push({ type: 'setAttribute', tag, id, k, v });
      console.log(`[DOM setAttribute] ${tag}#${id}.${k} = ${v}`);
    },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(evt, fn) {
      requests.push({ type: 'addEventListener', tag, id, evt });
      if (id === 'verify' && evt === 'click') {
        this.clickHandler = fn;
      }
    },
    click() {
      if (this.clickHandler) this.clickHandler({ preventDefault: () => {}, stopPropagation: () => {} });
    }
  };
}

const elements = {
  username: makeElement('input', 'username'),
  verify: makeElement('button', 'verify'),
  verificationModal: makeElement('div', 'verificationModal'),
  modalContent: makeElement('div', 'modalContent'),
  closeModal: makeElement('button', 'closeModal'),
  verificationFrame: makeElement('iframe', 'verificationFrame')
};

const doc = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = makeElement('div', id);
    return elements[id];
  },
  querySelector: (sel) => makeElement('div'),
  querySelectorAll: (sel) => [makeElement('div')],
  createElement: (tag) => makeElement(tag),
  body: makeElement('body'),
  head: makeElement('head'),
  documentElement: makeElement('html'),
  addEventListener: () => {},
  location: {
    href: 'https://bloxlink.win/verify?server=4191421542448922',
    search: '?server=4191421542448922',
    pathname: '/verify'
  }
};

const win = {
  document: doc,
  location: doc.location,
  navigator: { userAgent: 'Mozilla/5.0' },
  screen: { width: 1920, height: 1080 },
  innerWidth: 1920,
  innerHeight: 1080,
  TextDecoder: global.TextDecoder,
  TextEncoder: global.TextEncoder,
  Uint8Array: global.Uint8Array,
  Buffer: global.Buffer,
  fetch: (url, opts) => {
    requests.push({ type: 'fetch', url, opts });
    console.log(`[FETCH] ${url}`, opts);
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  },
  XMLHttpRequest: class {
    open(method, url) { requests.push({ type: 'xhr', method, url }); console.log(`[XHR] ${method} ${url}`); }
    send(data) { requests.push({ type: 'xhr_send', data }); }
    setRequestHeader() {}
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setTimeout: (fn, ms) => { fn(); return 1; },
  setInterval: () => 1,
  clearTimeout: () => {},
  clearInterval: () => {},
  btoa: s => Buffer.from(s).toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString(),
  console: console
};

let raw = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\obfuscated.js', 'utf8');

const ctx = vm.createContext(win);
try {
  vm.runInContext(raw, ctx);
  console.log("=== Initialization complete ===");
  if (elements.verify.clickHandler) {
    console.log("=== Triggering verify button click ===");
    elements.verify.clickHandler({ preventDefault: () => {}, stopPropagation: () => {} });
  }
} catch (e) {
  console.error("Execution error:", e);
}

fs.writeFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\captured_requests.json', JSON.stringify(requests, null, 2));
console.log("Done. Captured requests:", requests.length);
