import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
function runtime(upstream) {
    const context = vm.createContext({
        Request, Response, URL, Blob, FormData, crypto: webcrypto, atob, btoa,
        TextEncoder, Uint8Array, setTimeout,
        console: { log() {}, error() {} },
        fetch: upstream || (() => { throw new Error('无效输入不应访问上游'); })
    });
    vm.runInContext(source.replace('export default {', 'globalThis.worker = {'), context);
    return context;
}
const request = body => new Request('https://local.test/v1/audio/speech', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('页面模板中的浏览器脚本可解析，保留六个声音预设', async () => {
    const context = runtime();
    const response = await context.worker.fetch(new Request('https://local.test/'));
    assert.equal(response.status, 200);
    const html = await response.text();
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    new vm.Script(script);
    for (const voice of ['my-MM-NilarNeural', 'my-MM-ThihaNeural', 'zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'en-US-JennyNeural', 'en-US-GuyNeural']) {
        assert.ok(html.includes(voice));
    }
});

test('SSML 随声音切换语言，并转义文案及 XML 属性', () => {
    const context = runtime();
    for (const voice of ['my-MM-NilarNeural', 'zh-CN-XiaoxiaoNeural', 'en-US-GuyNeural']) {
        const ssml = context.getSsml('SUN MAY <fruit> & "drink"', voice, '+0%', '+0Hz', '+0%', 'general');
        assert.ok(ssml.includes('xml:lang="' + voice.slice(0, 5) + '"'));
        assert.ok(ssml.includes('&lt;fruit&gt; &amp; &quot;drink&quot;'));
        assert.ok(!ssml.includes('<mstts:express-as'));
    }
});

test('非法 JSON、空文案、无效参数返回 400，错误方法返回 405', async () => {
    const context = runtime();
    for (const body of [null, [], {}, { input: ' ' }, { input: 'hello', speed: 0 },
        { input: 'hello', speed: '1junk' }, { input: 'hello', speed: null },
        { input: 'hello', voice: '\"><break/>' }, { input: 'hello', style: '\">' }]) {
        assert.equal((await context.worker.fetch(request(body))).status, 400);
    }
    assert.equal((await context.worker.fetch(new Request('https://local.test/v1/audio/speech', { method: 'POST', body: '{' }))).status, 400);
    const response = await context.worker.fetch(new Request('https://local.test/v1/audio/speech'));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'POST');
});

test('三种语言与三档语速均正确传递上游，1.2 对应 +20%', async () => {
    const ssmlBodies = [];
    const context = runtime(async (url, options) => {
        if (String(url).includes('/apps/endpoint')) {
            const token = 'header.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.signature';
            return Response.json({ t: token, r: 'test-region' });
        }
        ssmlBodies.push(options.body);
        return new Response(new Uint8Array([73, 68, 51, 1]), { headers: { 'Content-Type': 'audio/mpeg' } });
    });
    for (const voice of ['my-MM-NilarNeural', 'zh-CN-YunxiNeural', 'en-US-JennyNeural']) {
        for (const [speed, rate] of [[0.8, '-20%'], [1, '+0%'], [1.2, '+20%']]) {
            const response = await context.worker.fetch(request({ input: 'မင်္ဂလာပါ / 你好 / Hello', voice, speed }));
            assert.equal(response.status, 200);
            assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
            assert.ok((await response.blob()).size > 0);
            assert.ok(ssmlBodies.at(-1).includes('rate="' + rate + '"'));
            assert.ok(ssmlBodies.at(-1).includes('name="' + voice + '"'));
        }
    }
});
