import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = {'.html':'text/html; charset=utf-8', '.mp4':'video/mp4', '.png':'image/png'};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(resolve(root) + sep)) {res.writeHead(403).end(); return;}
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Content-Length':data.length});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {res.writeHead(404).end('Not found. Run npm run build first.');}
}).listen(Number(process.env.PORT || 4176), '127.0.0.1', () => console.log(`http://localhost:${process.env.PORT || 4176}`));
