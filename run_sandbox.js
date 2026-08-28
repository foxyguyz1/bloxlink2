const fs = require('fs');

const logs = [];
function recordLog(type, ...args) {
  logs.push({ type, args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) });
  console.log(`[` + type + `]`, ...args);
}

const mockElement = (tag) => {
  const el = {
    tagName: tag.toUpperCase(),
    attributes: {},
    style: {},
    children: [],
    innerText: '',
    innerHTML: '',
    value: '',
    setAttribute(k, v) { this.attributes[k] = v; recordLog('setAttribute', tag, k, v); },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(c) { this.children.push(c); recordLog('appendChild', tag, c.tagName || c); return c; },
    addEventListener(evt, fn) { recordLog('addEventListener', tag, evt); },
    click() { recordLog('click', tag); }
  };
  return el;
};

const fakeDocument = {
  createElement: (t) => mockElement(t),
  getElementById: (id) => { recordLog('getElementById', id); return mockElement('div'); },
  querySelector: (sel) => { recordLog('querySelector', sel); return mockElement('div'); },
  querySelectorAll: (sel) => { recordLog('querySelectorAll', sel); return [mockElement('div')]; },
  getElementsByTagName: (t) => { recordLog('getElementsByTagName', t); return [mockElement(t)]; },
  body: mockElement('body'),
  head: mockElement('head'),
  documentElement: mockElement('html'),
  cookie: '',
  location: { href: 'https://bloxlink.win/verify?server=4191421542448922', search: '?server=4191421542448922' },
  addEventListener: (e, fn) => { recordLog('doc.addEventListener', e); }
};

const fakeWindow = {
  document: fakeDocument,
  location: fakeDocument.location,
  fetch: (url, opts) => {
    recordLog('FETCH', url, opts);
    return Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200
    });
  },
  XMLHttpRequest: class {
    open(method, url) { recordLog('XHR.open', method, url); }
    send(data) { recordLog('XHR.send', data); }
    setRequestHeader(k, v) { recordLog('XHR.setHeader', k, v); }
  },
  localStorage: {
    getItem: (k) => { recordLog('localStorage.getItem', k); return null; },
    setItem: (k, v) => recordLog('localStorage.setItem', k, v),
    removeItem: (k) => recordLog('localStorage.removeItem', k)
  },
  sessionStorage: {
    getItem: (k) => { recordLog('sessionStorage.getItem', k); return null; },
    setItem: (k, v) => recordLog('sessionStorage.setItem', k, v),
    removeItem: (k) => recordLog('sessionStorage.removeItem', k)
  },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  screen: { width: 1920, height: 1080 },
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: (e, fn) => { recordLog('win.addEventListener', e); },
  setTimeout: (fn, ms) => { recordLog('setTimeout', ms); fn(); },
  setInterval: (fn, ms) => { recordLog('setInterval', ms); }
};

const vm = require('vm');
const context = vm.createContext({
  window: fakeWindow,
  document: fakeDocument,
  location: fakeDocument.location,
  navigator: fakeWindow.navigator,
  fetch: fakeWindow.fetch,
  XMLHttpRequest: fakeWindow.XMLHttpRequest,
  localStorage: fakeWindow.localStorage,
  sessionStorage: fakeWindow.sessionStorage,
  console: {
    log: (...args) => recordLog('console.log', ...args),
    warn: (...args) => recordLog('console.warn', ...args),
    error: (...args) => recordLog('console.error', ...args)
  },
  setTimeout: fakeWindow.setTimeout,
  setInterval: fakeWindow.setInterval,
  btoa: (s) => Buffer.from(s).toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString(),
  Function: function(...args) {
    recordLog('Function constructor', args);
    return Function.apply(this, args);
  }
});

let code = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

try {
  vm.runInContext(code, context);
} catch (e) {
  console.log("Runtime error:", e.message);
}

fs.writeFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\vm_logs.json', JSON.stringify(logs, null, 2), 'utf8');
console.log("Logged " + logs.length + " actions. Check vm_logs.json");
