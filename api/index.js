import originalWorker from '../index.js';

const VOICES = ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural'];
const MAX_BYTES = 32768;
function json(data, status = 200, extra = {}) {
    return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
}
async function authorized(request, password) {
    const value = request.headers.get('Authorization') || '';
    const match = /^Bearer ([^\r\n]+)$/i.exec(value);
    if (!match || match[1].length > 512) return false;
    const encoder = new TextEncoder();
    const hashes = await Promise.all([password, match[1]].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
    const left = new Uint8Array(hashes[0]), right = new Uint8Array(hashes[1]);
    let difference = 0;
    for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
    return difference === 0;
}
async function boundedJson(request) {
    if (!request.body) throw new Error('empty');
    const reader = request.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) { await reader.cancel(); throw new Error('large'); }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes));
}

// 接口服务单独部署，不提供网页、转录或文件上传路由。
export function createApi(synthesize = request => originalWorker.fetch(request)) {
    return {
        async fetch(request, env = {}) {
            if (typeof env.AUTH_PASSWORD !== 'string' || !env.AUTH_PASSWORD) return json({ error: '服务尚未配置密码' }, 503);
            if (!await authorized(request, env.AUTH_PASSWORD)) return json({ error: '访问密码无效' }, 401, { 'WWW-Authenticate': 'Bearer realm="tts-voice-api"' });
            const path = new URL(request.url).pathname;
            if (path === '/health' && request.method === 'GET') return json({ status: 'ok', voices: VOICES });
            if (path !== '/v1/audio/speech') return json({ error: 'Not Found' }, 404);
            if (request.method !== 'POST') return json({ error: '只支持 POST' }, 405, { Allow: 'POST' });
            if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json({ error: '需要 application/json' }, 415);
            let body;
            try { body = await boundedJson(request); }
            catch (error) { return json({ error: error.message === 'large' ? '请求过大' : 'JSON 格式无效' }, error.message === 'large' ? 413 : 400); }
            if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: '请求格式无效' }, 400);
            const { input, voice = VOICES[0], speed = 1 } = body;
            if (typeof input !== 'string' || !input.trim() || input.length > 1500 || !VOICES.includes(voice) || typeof speed !== 'number' || !Number.isFinite(speed) || speed < 0.5 || speed > 2) return json({ error: '文案最多 1500 字符，声音须为晓晓或云希，语速须为 0.5–2.0' }, 400);
            if (body.response_format && body.response_format !== 'mp3') return json({ error: '只支持 MP3 输出' }, 400);
            try {
                const response = await synthesize(new Request(request.url, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input, voice, speed, pitch: 0, volume: 0, style: 'general' })
                }));
                if (!response.ok || !response.headers.get('Content-Type')?.startsWith('audio/')) return json({ error: '上游语音服务暂不可用' }, 502);
                return new Response(response.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
            } catch { return json({ error: '上游语音服务暂不可用' }, 502); }
        }
    };
}
export default createApi();
