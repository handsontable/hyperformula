const assert = require('assert');
const { stripVuePressSyntax } = require('./strip');

let passed = 0;
const check = (name, actual, expected) => {
  assert.strictEqual(actual, expected, `FAIL: ${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  passed++;
};

check('tip container',
  stripVuePressSyntax(':::tip Heads up\nBe careful here.\n:::'),
  '> **Heads up**\n>\n> Be careful here.');

check('warning no title',
  stripVuePressSyntax(':::warning\nDanger zone.\n:::'),
  '> Danger zone.');

check('code fence with ::: inside',
  stripVuePressSyntax('```js\nconst x = ":::tip";\n```'),
  '```js\nconst x = ":::tip";\n```');

check('script removed',
  stripVuePressSyntax('Text before\n<script>\nconsole.log(1)\n</script>\nText after'),
  'Text before\nText after');

check('vue component removed',
  stripVuePressSyntax('Intro\n<CodingAgentWizard />\nOutro'),
  'Intro\nOutro');

check('toc removed',
  stripVuePressSyntax('# Title\n[[toc]]\nBody'),
  '# Title\nBody');

check('content preserved',
  stripVuePressSyntax('# H\n\n`code`\n\n[link](/guide/x)\n\n| a | b |\n|---|---|'),
  '# H\n\n`code`\n\n[link](/guide/x)\n\n| a | b |\n|---|---|');

// 8. :::example container (live demo) stripped entirely
check('example container stripped',
  stripVuePressSyntax('## Demo\n\n::: example #ex1 --html 1\n@[code](example.html)\n:::\n\nOutro'),
  '## Demo\n\nOutro');

// 9. 4-backtick outer fence is not prematurely closed by 3-backtick inner fence
check('nested fence lengths',
  stripVuePressSyntax('````markdown\n```js\ncode\n```\n````'),
  '````markdown\n```js\ncode\n```\n````');

console.log(`PASS md-companions/strip (${passed} assertions)`);
