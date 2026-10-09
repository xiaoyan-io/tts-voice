import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const context = vm.createContext({Request, Response, URL, Blob, FormData, console});
vm.runInContext(source.replace('export default {', 'globalThis.worker = {'), context);
test('恢复原版完整界面，浏览器脚本可解析且首次访问默认中文', async () => {
  const response = await context.worker.fetch(new Request('https://local.test/'));
  assert.equal(response.status, 200);
  const html = await response.text();
  new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  assert.ok(html.includes("currentLanguage = 'zh'"));
  assert.ok(html.includes('zh-CN-XiaoxiaoNeural'));
  assert.ok(html.includes('id="voice"'));
  assert.ok(!html.includes('my-MM-ThihaNeural'));
  assert.ok(!html.includes('SUN MAY / AUDIO'));
});
test('中文文案生成 SSML 并转义 XML', () => {
  const ssml = context.getSsml('中文配音 <测试> & 演示', 'zh-CN-XiaoxiaoNeural', '+0%', '+0Hz', '+0%', 'general');
  assert.ok(ssml.includes('xml:lang="zh-CN"'));
  assert.ok(ssml.includes('&lt;测试&gt; &amp;'));
});
