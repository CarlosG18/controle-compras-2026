// Servidor local do Controle de Compras — sem dependências (só Node.js).
// Serve os arquivos do sistema e grava o banco em ./db.json.
//
//   node server.js            → http://localhost:3000
//   PORT=8080 node server.js  → outra porta
//
// Rotas:
//   GET  /api/db  → devolve o db.json (404 se ainda não existir)
//   PUT  /api/db  → grava o db.json (a versão anterior vai para db.backup.json)

"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, "db.json");
const BACKUP_FILE = path.join(ROOT, "db.backup.json");
const MAX_BODY = 5 * 1024 * 1024; // 5 MB

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Controle-Compras": "1"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error("arquivo grande demais")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// grava em arquivo temporário e renomeia, para nunca deixar o db.json pela metade
function writeAtomic(file, text) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

async function handleApi(req, res) {
  if (req.method === "GET") {
    if (!fs.existsSync(DB_FILE)) return send(res, 404, JSON.stringify({ erro: "db.json ainda não existe" }));
    return send(res, 200, fs.readFileSync(DB_FILE, "utf8"));
  }
  if (req.method === "PUT" || req.method === "POST") {
    let data;
    try {
      data = JSON.parse(await readBody(req));
    } catch (e) {
      return send(res, 400, JSON.stringify({ erro: "JSON inválido: " + e.message }));
    }
    if (!data || typeof data.meses !== "object") {
      return send(res, 400, JSON.stringify({ erro: 'faltando a chave "meses"' }));
    }
    try {
      if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, BACKUP_FILE);
      writeAtomic(DB_FILE, JSON.stringify(data, null, 2));
      return send(res, 200, JSON.stringify({ ok: true, atualizadoEm: data.atualizadoEm || null }));
    } catch (e) {
      return send(res, 500, JSON.stringify({ erro: "não foi possível gravar: " + e.message }));
    }
  }
  return send(res, 405, JSON.stringify({ erro: "método não permitido" }));
}

function handleStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) return send(res, 403, "Proibido", "text/plain; charset=utf-8");
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, "Não encontrado", "text/plain; charset=utf-8");
    send(res, 200, buf, TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/db") {
    handleApi(req, res).catch(e => send(res, 500, JSON.stringify({ erro: e.message })));
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\n  Controle de Compras rodando\n");
  console.log(`  Neste computador:  http://localhost:${PORT}`);
  Object.values(os.networkInterfaces()).flat().forEach(i => {
    if (i && i.family === "IPv4" && !i.internal) console.log(`  No celular (mesmo Wi-Fi):  http://${i.address}:${PORT}`);
  });
  console.log(`\n  Banco de dados: ${DB_FILE}\n  Para parar: Ctrl + C\n`);
});
