import http from 'node:http';
import worker from './index.js';

const password = process.env.AUTH_PASSWORD;
if (!password) throw new Error('必须配置 AUTH_PASSWORD');
const port = Number(process.env.PORT || 8789);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 无效');
http.createServer(async (incoming, outgoing) => {
    const headers = { 'Cache-Control': 'no-store' };
    try {
        const chunks = [];
        let size = 0;
        for await (const chunk of incoming) {
            size += chunk.length;
            if (size > 32768) {
                outgoing.writeHead(413, { ...headers, 'Content-Type': 'application/json' });
                outgoing.end('{"error":"请求过大"}');
                return;
            }
            chunks.push(chunk);
        }
        const method = incoming.method;
        const request = new Request(new URL(incoming.url, 'http://localhost:' + port), {
            method, headers: incoming.headers,
            ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) })
        });
        const response = await worker.fetch(request, { AUTH_PASSWORD: password });
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
        outgoing.writeHead(500, { ...headers, 'Content-Type': 'application/json' });
        outgoing.end('{"error":"接口请求失败"}');
    }
}).listen(port, '0.0.0.0', () => console.log('受保护的配音接口已启动，端口：' + port));
