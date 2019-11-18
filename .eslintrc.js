module.exports = {
  env: {
    browser: true,
	  commonjs: true,
    es6: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    "$": true // for jQuery
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
	"indent": ["error", 4]
  }
}
