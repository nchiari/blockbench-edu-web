import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const prefix = '/blockbench-edu-web/';
const types = {'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname === '/blockbench-edu-web') {res.writeHead(302,{Location:prefix});res.end();return;}
    if (!url.pathname.startsWith(prefix)) throw new Error('Unknown path');
    const target = path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length))||'index.html');
    if (!target.startsWith(root+path.sep)) throw new Error('Invalid path');
    const bytes = await fs.readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('http://localhost:4173/blockbench-edu-web/'));
