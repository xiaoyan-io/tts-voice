import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../api/index.js';

const env = { AUTH_PASSWORD: 'test-only-password' };
const request = (body, password = env.AUTH_PASSWORD, path = '/v1/audio/speech', method = 'POST') => new Request('http://local.test' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(password ? { Authorization: 'Bearer ' + password } : {}) },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {})
});
test('未配置密码时关闭服务；无密码或错误密码不能调用任何路由或上游', async () => {
    const api = createApi(() => { throw new Error('不应访问上游'); });
    assert.equal((await api.fetch(request({ input: '你好' }))).status, 503);
    for (const password of ['', 'wrong']) {
        for (const path of ['/', '/health', '/v1/audio/speech', '/v1/audio/transcriptions']) {
            assert.equal((await api.fetch(request({ input: '你好' }, password, path), env)).status, 401);
        }
    }
});
test('只允许健康检查与配音；非法正文在访问上游前被拒绝', async () => {
    const api = createApi(() => { throw new Error('不应访问上游'); });
    assert.equal((await api.fetch(request(null, env.AUTH_PASSWORD, '/health', 'GET'), env)).status, 200);
    assert.equal((await api.fetch(request(null, env.AUTH_PASSWORD, '/'), env)).status, 404);
    assert.equal((await api.fetch(request(null, env.AUTH_PASSWORD, '/v1/audio/speech', 'GET'), env)).status, 405);
    for (const body of ['{', null, [], { input: '' }, { input: 'a'.repeat(1501) }, { input: '你好', speed: '1' }, { input: '你好', voice: 'my-MM-NilarNeural' }]) {
        assert.equal((await api.fetch(request(body), env)).status, 400);
    }
    assert.equal((await api.fetch(request(' '.repeat(32769)), env)).status, 413);
});
test('正确密码生成 MP3，密码不传给合成引擎；不返回上游敏感错误', async () => {
    const api = createApi(async req => {
        assert.equal(req.headers.get('Authorization'), null);
        const body = await req.json();
        assert.equal(body.voice, 'zh-CN-XiaoxiaoNeural');
        assert.equal(body.speed, 1);
        return new Response(new Uint8Array([73, 68, 51]), { headers: { 'Content-Type': 'audio/mpeg', 'Access-Control-Allow-Origin': '*' } });
    });
    const response = await api.fetch(request({ input: '你好' }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const badApi = createApi(() => { throw new Error('sensitive-token'); });
    const bad = await badApi.fetch(request({ input: '你好' }), env);
    assert.equal(bad.status, 502);
    assert.ok(!(await bad.text()).includes('sensitive-token'));
});
