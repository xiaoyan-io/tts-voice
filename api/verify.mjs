import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8789';
const headers = { Authorization: 'Bearer ' + process.env.AUTH_PASSWORD };
for (const authorization of [null, 'Bearer wrong-password']) {
    const response = await fetch(base + '/health', { headers: authorization ? { Authorization: authorization } : {} });
    assert.equal(response.status, 401);
}
assert.equal((await fetch(base + '/', { headers })).status, 404);
assert.equal((await fetch(base + '/health', { headers })).status, 200);
const audio = await fetch(base + '/v1/audio/speech', {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: '你好，中文语音助手已经连接。', voice: 'zh-CN-XiaoxiaoNeural', speed: 1 }),
    signal: AbortSignal.timeout(60000),
});
assert.equal(audio.status, 200);
assert.equal(audio.headers.get('Content-Type'), 'audio/mpeg');
const bytes = new Uint8Array(await audio.arrayBuffer());
assert.ok(bytes.length > 1000);
assert.ok((bytes[0] === 255 && (bytes[1] & 224) === 224) || (bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51));
console.log(JSON.stringify({ missingPassword: 401, wrongPassword: 401, noWebUI: 404, authenticatedHealth: 200, audioStatus: 200, mp3Bytes: bytes.length }));
