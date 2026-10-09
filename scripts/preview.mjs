import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';

// 本地 Node 预览桥接同一个 Worker，不用于生产部署。
const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const port = Number(process.env.PORT || 8788);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是有效端口');

const server = http.createServer(async (incoming, outgoing) => {
    try {
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        const method = incoming.method;
        const request = new Request(new URL(incoming.url, 'http://localhost:' + port), {
            method,
            headers: incoming.headers,
            ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) })
        });
        const response = await worker.fetch(request);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
        console.error('本地预览请求失败：', error.message);
        outgoing.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        outgoing.end('本地预览请求失败，请检查终端日志。');
    }
});
server.on('error', error => {
    console.error('预览启动失败：', error.message);
    process.exitCode = 1;
});
server.listen(port, '0.0.0.0', () => {
    console.log('电脑预览：http://127.0.0.1:' + port + '/');
    for (const addresses of Object.values(networkInterfaces())) {
        for (const address of addresses) {
            if (address.family === 'IPv4' && !address.internal) {
                console.log('局域网预览：http://' + address.address + ':' + port + '/');
            }
        }
    }
});
