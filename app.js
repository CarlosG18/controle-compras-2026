/* Controle de Compras 2026 — reproduz o comportamento da planilha "controle_compras_2026".
 *
 * Regras (iguais às fórmulas da planilha):
 *  - Preço Total            = Qtd × Preço Unit. (só quando os dois são números)
 *  - Valor Mês Passado      = Preço Unit. do item com o mesmo nome (sem diferenciar maiúsculas/espaços) no mês anterior
 *  - Economia c/ Mês Passado = Valor Mês Passado − Preço Unit.
 *  - Total geral do mês     = soma do Preço Total dos itens marcados como comprados
 *  - Previsto (lista toda)  = soma do Preço Total de todos os itens
 *  - Dashboard: total gasto, comprados, pendentes e gasto por categoria (só comprados) por mês;
 *    maior mês, menor mês (> 0) e média mensal (meses > 0); Top 5 itens mais caros do mês escolhido
 *    (todos os itens com preço); gasto anual por categoria com % e média mensal.
 */
(function () {
  "use strict";

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const CATS = ["Limpeza", "Grosso", "Salgado/Frios", "Frutas e Verduras"];
  const CATKEY = ["limp", "gros", "salg", "frut"];
  const STORE_KEY = "controle-compras-2026-v1";

  /* ---------------- Dados iniciais (copiados da planilha) ---------------- */
  const L = 0, G = 1, S = 2, F = 3;
  const BASE = [
    [L, "Sabonete", 2], [L, "Desodorante", 1], [L, "Pasta de dente", 1], [L, "Água sanitária", 1], [L, "Limpol", 1],
    [L, "Bucha", 1], [L, "Absorvente Always", 1], [L, "Sabão líquido refil", 1], [L, "Papel higiênico", 1], [L, "Rodo", 1],
    [L, "Escova de dente", 1], [G, "Arroz", 2], [G, "Cuscuz", 4], [G, "Bolacha cream cracker", 1], [G, "Biscoito Maria", 1],
    [G, "Goma", 1], [G, "Nescau (anotar ml: ___)", 1], [G, "Pão de forma", 1], [G, "Molho de tomate", 1], [S, "Ovo", 1],
    [S, "Mortadela", 1], [S, "Queijo", 1], [F, "Cebola", 1], [F, "Tomate", 1], [F, "Macaxeira", 1], [F, "Batata inglesa", 1],
    [F, "Banana", 1], [F, "Couve (opcional)", 1], [F, "Abacaxi (opcional)", 1]
  ];
  const ABRIL_PRECOS = [1.89, 16.9, 2.99, 2.49, 1.69, 0.69, 8.9, 13.9, 3.2, 7, 3.9, 3.59, 1.05, 5.69, 6.49, 5.59, 1.25, 5.49, 1.59, 15, 5.39, 7.72, 4.69, 8.59, 3.89, 6.79, 4.59, 3, 4];

  // [categoria, item, qtd, comprado(0/1), preço unit.]
  const RAW = {
    Junho: [
      [L, "Sabonete", 3, 0, 0.89], [L, "Desodorante", 1, 0, 17.9], [L, "Pasta de dente", 2, 0, 2.29], [L, "Água sanitária", 1, 0, 2.19],
      [L, "Limpol", 1, 0, 1.69], [L, "Bucha", 1, 0, 0.85], [L, "Absorvente Always", 1, 0, 9], [L, "Sabão líquido refil", 1, 0, 8.79],
      [L, "Papel higiênico", 1, 1, 3.2], [L, "prostobarba", 1, 0, 6.49], [L, "Amaciante", 1, 0, 2], [L, "xampu", 1, 0, 12.9],
      [L, "condicionador", 1, 0, 15.9], [L, "creme", 1, 0, 11.9], [G, "vinho", 1, 1, 14.5], [G, "Arroz", 3, 0, 3.29],
      [G, "Cuscuz", 2, 0, 1.14], [G, "Bolacha cream cracker", 2, 0, 6], [G, "Biscoito Maria", 1, 0, 7], [G, "Bolacha salgada", 1, 0, 4],
      [G, "Rosquinha", 1, 0, 4.29], [G, "Goma", 1, 0, 6], [G, "Nescau (anotar ml: ___)", 1, 0, 8.9], [G, "leite condensado", 2, 0, 4.29],
      [G, "creme de leite", 4, 0, 1.59], [G, "Milho e ervilha", 1, 0, 3.19], [G, "Leite em caixa", 1, 0, 5.69], [G, "feijão", 2, 0, 6.49],
      [G, "sardinha", 2, 0, null], [G, "Pão de forma", 2, 0, 6.9], [G, "milho de pipoca", 1, 0, 3], [G, "farinha", 1, 0, 4],
      [G, "Sal", 1, 0, 1.95], [G, "fardo de refri", 1, 1, 17.4], [G, "Molho de tomate", 2, 0, 1.25], [G, "Margarina", 1, 0, 7],
      [G, "macarrão", 2, 0, 1.85], [G, "Açúcar", 1, 0, 3.49], [S, "Ovo", 1, 0, 15.69], [S, "Mortadela", 1, 0, 7],
      [S, "Queijo", 1, 0, 8.15], [S, "presunto", 1, 0, 3.87], [S, "polpa de frutas", 2, 0, 9.48], [S, "frango a passarinho", 1, 0, 8.59],
      [S, "salsicha", 1, 0, 11.6], [S, "Pão de Alho", 1, 0, null], [S, "Carne de Hamburger", 1, 0, null], [S, "Pizza", 1, 0, null],
      [F, "alho", 1, 0, 4.89], [F, "Cebola", 1, 0, null], [F, "Tomate", 1, 0, null], [F, "Macaxeira", 1, 0, 9.79],
      [F, "Batata inglesa", 1, 0, null], [F, "batata doce", 1, 0, 3.29], [F, "cenoura", 1, 0, null], [F, "coentro", 1, 0, 1.15]
    ],
    Julho: [
      [L, "Sabonete", 2, 0, 1], [L, "Água sanitária", 1, 0, 1.95], [L, "Limpol", 1, 0, 1.45], [L, "Sabão líquido refil", 1, 0, 5.49],
      [L, "Papel higiênico", 1, 0, 2.8], [G, "Arroz", 1, 0, 3.75], [G, "macarrão", 1, 0, 2.39], [G, "Cuscuz", 1, 0, 1],
      [G, "Bolacha cream cracker", 1, 0, 6.69], [G, "milho de pipoca", 1, 0, 2.89], [G, "queijo ralado", 1, 0, 4.79], [G, "Biscoito Maria", 1, 0, 6.19],
      [G, "Rosquinha", 1, 0, 5.89], [G, "Bolacha", 1, 0, 3.29], [G, "Goma", 1, 0, 4.85], [G, "clube social", 1, 0, 5.55],
      [G, "Nescau (anotar ml: ___)", 10, 0, 1], [G, "Nescau em pó", 1, 0, 4.89], [G, "Pão de forma", 2, 0, 6.9], [G, "Molho de tomate", 1, 0, 1.29],
      [G, "Biscoito", 6, 1, 0.89], [G, "manteiga", 2, 1, 2.69], [S, "Ovo", 1, 0, 7], [S, "salsicha", 1, 0, 11.9],
      [S, "polpa de frutas", 1, 1, 11.9], [S, "Mortadela", 1, 0, 5], [S, "Queijo", 1, 1, 4.4], [G, "leite", 1, 1, 6.49],
      [F, "maçã", 1, 1, 9.43], [F, "cenoura", 1, 0, 8], [F, "Alface", 1, 0, 3], [F, "Banana", 1, 0, 5]
    ],
    Agosto: [
      [L, "Sabonete", 3, 0, 1.85], [L, "Sabonete", 1, 0, 8.15], [L, "Limpa aí feira", 1, 0, 19], [L, "Desodorante", 1, 0, 16.9],
      [L, "Pasta de dente", 1, 0, 2.29], [L, "creme de cabelo", 1, 0, null], [L, "Água sanitária", 1, 0, 1.85], [L, "Limpol", 1, 0, 1.29],
      [L, "Bucha", 2, 0, 0.75], [L, "Absorvente Always", 1, 0, 9], [L, "Papel higiênico", 1, 0, 3.4], [L, "Amaciante", 1, 0, 6],
      [L, "Prestobarba", 1, 0, 5.79], [G, "Arroz", 3, 0, 3.89], [G, "Macarrão", 3, 0, 1.89], [G, "Coloral", 3, 0, 1.19],
      [G, "Sazon", 3, 0, 5.59], [G, "Feijão", 2, 0, 6.39], [G, "Creme de leite", 3, 0, 1.65], [G, "Cuscuz", 4, 0, 1.05],
      [G, "Bolacha cream cracker", 1, 0, 5.79], [G, "Biscoito Maria", 1, 0, 5.89], [S, "Polpa", 1, 0, 2.49], [G, "Rosquinha", 1, 0, 5.29],
      [G, "Nescau (anotar ml: ___)", 12, 0, 0.89], [G, "Tempero completo", 1, 0, 4], [G, "Pão de forma", 2, 0, 4.97], [G, "Coca", 1, 0, 4.5],
      [S, "Leite", 1, 0, 6.49], [S, "salsicha", 1, 0, 14.6], [S, "Queijo", 1, 0, 7.22], [S, "Polpa", 1, 0, 13],
      [S, "Torta", 1, 0, 17], [S, "Pão de alho", 1, 0, 11.5], [S, "Batata palha", 1, 0, 9.9], [F, "Sorvete", 1, 0, 14.9],
      [S, "Biscoito", 12, 0, 0.83], [F, "Macaxeira", 1, 0, 9.97], [F, "Alface", 1, 0, 2], [F, "Cebola", 1, 0, 5.89],
      [F, "Uva", 1, 0, 20], [F, "Iogurte", 3, 0, 3.79]
    ],
    Setembro: [
      [L, "Sabonete", 3, 0, 1.89], [L, "Desodorante", 1, 0, 17.99], [L, "Pasta de dente", 2, 0, 2.29], [L, "Água sanitária", 1, 0, 1.95],
      [L, "Limpol", 1, 0, 1.35], [L, "Saco de lixo", 1, 0, 4.59], [L, "Formigas", 1, 0, 9.98], [L, "Sabão líquido refil", 1, 0, 9.49],
      [L, "Papel higiênico", 1, 0, 10.99], [G, "Macarrão", 3, 0, 2.49], [G, "Feijão", 1, 0, 6.49], [G, "Arroz", 3, 0, 3.69],
      [G, "Cuscuz", 2, 0, 1.15], [G, "Bolacha cream cracker", 3, 0, 3.49], [G, "Biscoito Maria", 1, 0, 4.85], [G, "Rosquinha", 1, 0, 4],
      [G, "Nescau", 1, 0, 5.69], [G, "Nescau (anotar ml: ___)", 12, 0, 1.09], [G, "Pão de forma", 2, 0, 4.98], [G, "Manteiga", 2, 0, 2.15],
      [G, "Óleo", 1, 0, 7.89], [S, "Salsicha", 1, 0, 14.48], [S, "Iogurte", 1, 0, 5.29], [S, "Ovo", 1, 0, 14],
      [S, "Mortadela", 1, 0, 5.29], [S, "Queijo", 1, 0, 7.37], [S, "Linguiça", 1, 0, 16], [S, "Frango promoção", 1, 0, 14.29],
      [F, "Cebola", 1, 0, 0.93], [F, "Tomate", 1, 0, 1.2], [S, "Refrigerante", 8, 0, 1.45], [S, "Biscoito", 3, 0, 2],
      [S, "Tortinha", 3, 0, 2.49]
    ]
  };

  function newId() { return Math.random().toString(36).slice(2, 10); }
  function mkRow(c, item, qty, bought, unit) {
    return { id: newId(), cat: CATS[c], item: item, qty: qty, bought: !!bought, unit: unit == null ? null : unit, brand: "", obs: "" };
  }
  function seed() {
    const months = {};
    MESES.forEach(m => { months[m] = BASE.map(b => mkRow(b[0], b[1], b[2], 0, null)); });
    months.Janeiro[0].unit = 12;
    months.Abril = BASE.map((b, i) => mkRow(b[0], b[1], b[1].startsWith("Nescau") ? 5 : b[2], 1, ABRIL_PRECOS[i]));
    Object.keys(RAW).forEach(m => { months[m] = RAW[m].map(r => mkRow(r[0], r[1], r[2], r[3], r[4])); });
    return { months: months, view: "dash", topMonth: "Setembro", filter: "all" };
  }

  /* ---------------- Banco de dados (db.json) ----------------
   * O banco é um arquivo JSON. Três modos, escolhidos sozinhos ao abrir:
   *  - "server": aberto por `node server.js` → lê e grava ./db.json pela rota /api/db
   *  - "file":   (Chrome/Edge) você conecta um db.json do computador e o sistema grava nele
   *  - "local":  sem servidor → cópia no navegador; use Exportar/Importar db.json
   */
  const PREFS_KEY = "controle-compras-2026-prefs";
  const LOCAL_KEY = "controle-compras-2026-db";
  const DB = { mode: "local", handle: null, fileName: "", lastSaved: "", updatedAt: null, readonly: false, timer: null, chain: Promise.resolve(), status: "ok", msg: "" };
  const canPickFile = typeof window.showOpenFilePicker === "function";

  function toDB(months) {
    const meses = {};
    MESES.forEach(m => {
      meses[m] = months[m].map(r => ({
        id: r.id, categoria: r.cat, item: r.item, qtd: r.qty, comprado: r.bought,
        precoUnit: r.unit, marca: r.brand, observacoes: r.obs
      }));
    });
    const out = { app: "controle-compras", versao: 1, ano: 2026, atualizadoEm: new Date().toISOString(), meses: meses };
    if (state && state.faxina) out.faxina = state.faxina;
    return out;
  }
  function fromDB(data) {
    if (!data || typeof data !== "object" || !data.meses || typeof data.meses !== "object") {
      throw new Error('o arquivo não tem a chave "meses"');
    }
    const toNum = v => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" ? parseNum(v) : null);
    const months = {};
    MESES.forEach(m => {
      const list = Array.isArray(data.meses[m]) ? data.meses[m] : [];
      months[m] = list.map(x => ({
        id: String(x.id || newId()), cat: String(x.categoria || CATS[0]), item: String(x.item == null ? "" : x.item),
        qty: toNum(x.qtd), bought: !!x.comprado, unit: toNum(x.precoUnit),
        brand: String(x.marca == null ? "" : x.marca), obs: String(x.observacoes == null ? "" : x.observacoes)
      }));
    });
    return months;
  }

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ view: state.view, month: state.month, topMonth: state.topMonth, filter: state.filter, sort: state.sort, group: state.group, module: state.module, week: state.week, fxView: state.fxView, fxFilter: state.fxFilter })); } catch (e) { /* ignora */ }
  }

  async function askServer() {
    if (location.protocol === "file:") return null;
    try {
      const r = await fetch("api/db", { cache: "no-store" });
      if (r.headers.get("X-Controle-Compras") !== "1") return null; // não é o nosso servidor
      if (r.status === 404) return { data: null };
      if (!r.ok) return null;
      return { data: await r.json() };
    } catch (e) { return null; }
  }

  const snapshot = () => JSON.stringify([state.months, state.faxina]);
  function save() { savePrefs(); clearTimeout(DB.timer); DB.timer = setTimeout(flush, 400); }
  function flush() { clearTimeout(DB.timer); DB.chain = DB.chain.then(writeDB); return DB.chain; }

  async function writeDB() {
    if (DB.readonly) return;
    const snap = snapshot();
    if (snap === DB.lastSaved) return;
    const payload = toDB(state.months);
    const text = JSON.stringify(payload, null, 2);
    setStatus("busy", "Salvando…");
    try {
      if (DB.mode === "server") {
        const r = await fetch("api/db", { method: "PUT", headers: { "Content-Type": "application/json" }, body: text, keepalive: text.length < 60000 });
        if (!r.ok) throw new Error("o servidor respondeu " + r.status);
      } else if (DB.mode === "file") {
        const w = await DB.handle.createWritable();
        await w.write(text);
        await w.close();
      } else {
        localStorage.setItem(LOCAL_KEY, text);
      }
      DB.lastSaved = snap;
      DB.updatedAt = payload.atualizadoEm;
      setStatus("ok");
    } catch (e) {
      setStatus("err", "Não foi possível salvar: " + e.message);
    }
  }

  // ao voltar para a aba, busca alterações feitas em outro aparelho (modo servidor)
  async function pullServer() {
    if (DB.mode !== "server" || DB.readonly) return;
    if (snapshot() !== DB.lastSaved) return; // há alterações locais ainda não salvas
    const srv = await askServer();
    if (!srv || !srv.data || srv.data.atualizadoEm === DB.updatedAt) return;
    try {
      state.months = fromDB(srv.data);
      state.faxina = fromFaxina(srv.data) || state.faxina;
      DB.updatedAt = srv.data.atualizadoEm;
      DB.lastSaved = snapshot();
      setStatus("ok");
      render();
    } catch (e) { /* mantém o que está na tela */ }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else pullServer();
  });
  window.addEventListener("pagehide", () => { flush(); });

  let state = null;

  /* ---------------- Cálculos ---------------- */
  const isNum = v => typeof v === "number" && isFinite(v);
  const norm = s => String(s || "").trim().toLowerCase();
  const round2 = v => Math.round(v * 100) / 100;

  function catIdx(cat) {
    const c = String(cat || "").trim();
    return CATS.findIndex(k => c.startsWith(k)); // igual ao curinga "Limpeza*" da planilha
  }
  function rowTotal(r) { return isNum(r.qty) && isNum(r.unit) ? r.qty * r.unit : null; }
  function prevPrice(mIdx, item) {
    if (mIdx <= 0 || !norm(item)) return null;
    const prev = state.months[MESES[mIdx - 1]];
    const hit = prev.find(p => norm(p.item) === norm(item));
    return hit && isNum(hit.unit) ? hit.unit : null;
  }
  function economy(prev, unit) { return isNum(prev) && isNum(unit) ? prev - unit : null; }

  function summary(m) {
    const s = { spent: 0, planned: 0, bought: 0, pending: 0, cats: [0, 0, 0, 0] };
    state.months[m].forEach(r => {
      const t = rowTotal(r);
      if (isNum(t)) s.planned += t;
      if (r.bought) {
        s.bought++;
        if (isNum(t)) {
          s.spent += t;
          const ci = catIdx(r.cat);
          if (ci >= 0) s.cats[ci] += t;
        }
      } else s.pending++;
    });
    return s;
  }

  /* ---------------- Formatação ---------------- */
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const money = v => (isNum(v) ? BRL.format(round2(v) || 0) : "—");
  function signed(v) {
    if (!isNum(v)) return "";
    const r = round2(v);
    if (r > 0) return "+" + BRL.format(r);
    if (r < 0) return "−" + BRL.format(-r);
    return BRL.format(0);
  }
  const numIn = v => (isNum(v) ? String(v).replace(".", ",") : "");
  function parseNum(s) {
    let t = String(s).trim().replace(/R\$\s?/i, "").replace(/\s/g, "");
    if (!t) return null;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(t);
    return isFinite(n) ? n : null;
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = v => (isNum(v) ? (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%" : "—");

  /* ---------------- Ícones (SVG inline, sem dependências) ---------------- */
  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cart: '<path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    browser: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'
  };
  const icon = (n, cls) => `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;

  /* ---------------- Utilidades de interface ---------------- */
  const MES_ABREV = m => m.slice(0, 3);
  const fold = s => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isNarrow = () => window.matchMedia("(max-width: 720px)").matches;
  const pctFmt = v => (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

  // comparação com o mês anterior: diff > 0 = ficou mais caro (economia negativa)
  function compareInfo(mIdx, r) {
    const prev = prevPrice(mIdx, r.item);
    if (!isNum(prev) || !isNum(r.unit)) return { prev: prev, has: false };
    const diff = round2(r.unit - prev);
    const pct = prev > 0 ? diff / prev : null;
    return { prev: prev, has: true, diff: diff, pct: pct, dir: diff > 0 ? "up" : diff < 0 ? "down" : "eq" };
  }
  function deltaChip(c, prevMonth) {
    if (!c.has) return "";
    if (c.dir === "eq") return `<span class="delta eq" title="Mesmo preço de ${prevMonth}">= ${MES_ABREV(prevMonth)}</span>`;
    const txt = isNum(c.pct) ? pctFmt(Math.abs(c.pct)) : BRL.format(Math.abs(c.diff));
    const word = c.dir === "up" ? "mais caro" : "mais barato";
    return `<span class="delta ${c.dir}" title="${word} que em ${prevMonth}: ${money(c.prev)} → atual">${icon(c.dir)}<span class="sr-only">${word}</span>${txt}</span>`;
  }
  function priceSummary(m) {
    const mIdx = MESES.indexOf(m);
    let n = 0, up = 0, down = 0, sum = 0;
    state.months[m].forEach(r => {
      const c = compareInfo(mIdx, r);
      if (!c.has || !isNum(c.pct)) return;
      n++; sum += c.pct;
      if (c.dir === "up") up++; else if (c.dir === "down") down++;
    });
    return { n: n, up: up, down: down, avg: n ? sum / n : null };
  }

  /* ---------------- Elementos ---------------- */
  const $view = document.getElementById("view");
  const $status = document.getElementById("dbStatus");
  const $addTop = document.getElementById("addTop");
  const $bar = document.getElementById("bottombar");
  const $layer = document.getElementById("sheetLayer");
  const $sheet = document.getElementById("sheet");
  const $toasts = document.getElementById("toasts");
  const $tabs = document.querySelectorAll("[data-goto]");

  /* ---------------- Toasts ---------------- */
  function toast(msg, opts) {
    opts = opts || {};
    const el = document.createElement("div");
    el.className = "toast" + (opts.error ? " err" : "");
    el.innerHTML = `<span class="msg"></span>${opts.action ? `<button type="button">${esc(opts.action)}</button>` : ""}`;
    el.querySelector(".msg").textContent = msg;
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 220); };
    if (opts.action) el.querySelector("button").addEventListener("click", () => { close(); opts.onAction(); });
    $toasts.appendChild(el);
    while ($toasts.children.length > 3) $toasts.firstChild.remove();
    setTimeout(close, opts.duration || (opts.action ? 6000 : 2600));
  }

  /* ---------------- Status do banco ---------------- */
  const MODE_LABEL = { server: "db.json", file: "Arquivo", local: "Navegador" };
  function timeLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return new Date().toDateString() === d.toDateString()
      ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  let lastStatus = "ok";
  function setStatus(status, msg) {
    const was = lastStatus;
    DB.status = status;
    DB.msg = msg || "";
    lastStatus = status;
    renderStatus();
    if (status === "err" && was !== "err" && state) {
      toast(DB.msg || "Não foi possível salvar.", { error: true, action: "Tentar de novo", onAction: () => { DB.lastSaved = ""; flush(); } });
    }
    if (status === "ok" && was === "err") toast("Alterações salvas.");
    if (sheetKind === "data") renderDataSheet();
  }
  function renderStatus() {
    let text;
    if (DB.status === "busy") text = "Salvando…";
    else if (DB.status === "err") text = "Erro ao salvar";
    else text = MODE_LABEL[DB.mode] + (DB.updatedAt ? " · " + timeLabel(DB.updatedAt) : "");
    $status.className = "db-pill " + DB.status;
    $status.innerHTML = `<span class="t">${esc(text)}</span>`;
    $status.setAttribute("aria-label", "Banco de dados: " + text + ". Abrir opções de dados");
    $status.title = DB.msg || "Banco de dados: " + text;
  }

  /* ---------------- Navegação ---------------- */
  let monthAnim = "";
  function go(view, month) {
    if (month && MESES.includes(month)) {
      const from = MESES.indexOf(state.month), to = MESES.indexOf(month);
      monthAnim = to > from ? "slide-l" : to < from ? "slide-r" : "fade-in";
      state.month = month;
    } else monthAnim = "fade-in";
    state.view = view;
    savePrefs();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  $tabs.forEach(b => b.addEventListener("click", () => (state.module === "faxina" ? fxGo(b.dataset.goto) : go(b.dataset.goto))));
  $status.addEventListener("click", () => openDataSheet());
  $addTop.addEventListener("click", () => (state.module === "faxina" ? fxOpenSheet(null) : openItemSheet(null)));

  function render() {
    $view.removeAttribute("aria-busy");
    renderModule();
    const fx = state.module === "faxina";
    const tabs = fx ? [["week", "Semana"], ["hist", "Histórico"]] : [["month", "Mês"], ["year", "Ano"]];
    $tabs.forEach((b, i) => {
      b.dataset.goto = tabs[i][0];
      b.textContent = tabs[i][1];
      b.setAttribute("aria-pressed", String(tabs[i][0] === (fx ? state.fxView : state.view)));
    });
    $addTop.disabled = false;
    $addTop.innerHTML = `${icon("plus")}${fx ? "Adicionar tarefa" : "Adicionar item"}`;
    if (fx) {
      fxRender();
      const showBar = state.fxView === "week";
      $bar.hidden = !showBar;
      document.body.classList.toggle("has-bar", showBar);
      if (showBar) fxRenderBar();
      return;
    }
    if (state.view === "year") { renderYear(); $bar.hidden = true; document.body.classList.remove("has-bar"); }
    else { renderMonth(); $bar.hidden = false; document.body.classList.add("has-bar"); renderBar(); }
  }

  /* ---------------- Tela do mês ---------------- */
  function bannerHTML() {
    if (DB.readonly) {
      return `<div class="banner err" role="alert">${icon("alert")}<div class="grow"><b>Não foi possível ler o db.json</b>
        O arquivo está com problema, então nada será gravado por cima dele. Corrija o arquivo ou importe um backup válido.</div>
        <button type="button" class="btn" data-act="open-data">Ver dados</button></div>`;
    }
    return "";
  }

  function renderMonth() {
    const m = state.month;
    const mIdx = MESES.indexOf(m);
    $view.innerHTML = `
      ${bannerHTML()}
      <div class="monthbar">
        <button type="button" class="icon-btn" data-act="prev" ${mIdx === 0 ? "disabled" : ""} aria-label="${mIdx > 0 ? "Ir para " + MESES[mIdx - 1] : "Sem mês anterior"}">${icon("chevL")}</button>
        <button type="button" class="month-current" id="monthBtn" aria-haspopup="true" aria-expanded="false" aria-controls="monthPop">
          <h1>${m} 2026</h1>${icon("chevD")}
        </button>
        <button type="button" class="icon-btn" data-act="next" ${mIdx === 11 ? "disabled" : ""} aria-label="${mIdx < 11 ? "Ir para " + MESES[mIdx + 1] : "Sem próximo mês"}">${icon("chevR")}</button>
        <span class="spacer"></span>
        <span class="month-hint">${mIdx > 0 ? "Preços comparados com " + MESES[mIdx - 1] : "Primeiro mês do ano"}</span>
        <div class="month-pop" id="monthPop" hidden></div>
      </div>
      <div class="month-layout ${monthAnim}">
        <aside class="summary" id="summary" aria-label="Resumo do mês"></aside>
        <section class="listsec" aria-labelledby="listTitle">
          <div class="listhead"><h2 id="listTitle">Lista de compras</h2><span class="count" id="visibleCount" aria-live="polite"></span></div>
          <div class="controls">
            <label class="search" for="q">${icon("search")}<span class="sr-only">Buscar item</span>
              <input type="search" id="q" placeholder="Buscar item" autocomplete="off" value="${esc(ui.q)}">
              <button type="button" class="icon-btn" data-act="clear-q" aria-label="Limpar busca" ${ui.q ? "" : "hidden"}>${icon("x", "sm")}</button>
            </label>
            <div class="seg" role="group" aria-label="Mostrar" id="filterSeg"></div>
            <div class="ctrl-more">
              <label class="sr-only" for="sortSel">Ordenar</label>
              <select class="select" id="sortSel">
                <option value="list">Ordem da lista</option>
                <option value="pending">Pendentes primeiro</option>
                <option value="name">Nome (A–Z)</option>
                <option value="value">Maior valor</option>
              </select>
              <label class="toggle"><input type="checkbox" id="groupChk" ${state.group ? "checked" : ""}><span class="sw"></span>Por categoria</label>
            </div>
          </div>
          <div class="list" id="list"></div>
        </section>
      </div>`;
    monthAnim = "";
    document.getElementById("sortSel").value = state.sort;
    renderSummary();
    renderList();
  }

  function renderSummary() {
    const el = document.getElementById("summary");
    if (!el) return;
    const m = state.month, mIdx = MESES.indexOf(m);
    const s = summary(m);
    const total = s.bought + s.pending;
    const prog = total ? (s.bought / total) * 100 : 0;
    const ps = priceSummary(m);
    const prevM = mIdx > 0 ? MESES[mIdx - 1] : null;
    const catBar = s.spent > 0
      ? s.cats.map((v, i) => (v > 0 ? `<i class="${CATKEY[i]}" style="width:${(v / s.spent) * 100}%" title="${CATS[i]}: ${money(v)}"></i>` : "")).join("")
      : "";
    let priceTxt, priceSub;
    if (!prevM) { priceTxt = "Sem dados para comparar"; priceSub = "Janeiro é o primeiro mês do ano"; }
    else if (!ps.n) { priceTxt = "Sem dados para comparar"; priceSub = `Nenhum item com preço em ${m} e em ${prevM}`; }
    else {
      const a = ps.avg, dir = Math.abs(a) < 0.0005 ? "eq" : a > 0 ? "up" : "down";
      priceTxt = dir === "eq" ? "Preços estáveis" : `${dir === "up" ? "Subiram" : "Caíram"} ${pctFmt(Math.abs(a))} em média`;
      priceSub = `${ps.n} ${ps.n === 1 ? "item comparado" : "itens comparados"} com ${prevM} · ${ps.down} mais ${ps.down === 1 ? "barato" : "baratos"}, ${ps.up} mais ${ps.up === 1 ? "caro" : "caros"}`;
    }
    el.innerHTML = `
      <section class="card hero" aria-labelledby="heroLbl">
        <div>
          <p class="label" id="heroLbl">Total gasto em ${m}</p>
          <p class="big money">${money(s.spent)}</p>
        </div>
        <p class="planned">Previsto para a lista toda: <b class="money">${money(s.planned)}</b></p>
        <div>
          <div class="progress" role="progressbar" aria-label="Itens comprados" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${s.bought}"><i style="width:${prog}%"></i></div>
          <div class="progress-row"><span><b>${s.bought}</b> de ${total} itens comprados</span><span>${Math.round(prog)}%</span></div>
        </div>
        <div class="catmix">
          <span class="eyebrow">Gasto por categoria</span>
          <div class="bar" aria-hidden="true">${catBar}</div>
          <ul>${CATS.map((c, i) => `<li><span class="dot ${CATKEY[i]}"></span><span class="n">${c}</span><span class="v money">${money(s.cats[i])}</span></li>`).join("")}</ul>
        </div>
      </section>
      <section class="card stats" aria-label="Indicadores">
        <button type="button" class="stat" data-filter="pend" aria-label="Mostrar ${s.pending} itens pendentes">
          <span class="stat-ic amber">${icon("clock")}</span>
          <span><span class="t">Pendentes</span><span class="s">ainda não comprados</span></span>
          <span class="n">${s.pending}</span>
        </button>
        <button type="button" class="stat" data-filter="ok" aria-label="Mostrar ${s.bought} itens comprados">
          <span class="stat-ic green">${icon("check")}</span>
          <span><span class="t">Comprados</span><span class="s">já no carrinho</span></span>
          <span class="n">${s.bought}</span>
        </button>
        <div class="stat stat-price">
          <span class="stat-ic ${ps.n ? (ps.avg > 0.0005 ? "amber" : "green") : "neutral"}">${icon("trend")}</span>
          <span><span class="t">${priceTxt}</span><span class="s">${priceSub}</span></span>
          <span></span>
        </div>
      </section>`;
  }

  function visibleRows() {
    const m = state.month;
    const q = fold(ui.q);
    let rows = state.months[m].map((r, i) => ({ r: r, i: i }));
    if (q) rows = rows.filter(x => fold(x.r.item).includes(q));
    if (state.filter === "pend") rows = rows.filter(x => !x.r.bought);
    else if (state.filter === "ok") rows = rows.filter(x => x.r.bought);
    const cmpName = (a, b) => fold(a.r.item).localeCompare(fold(b.r.item), "pt-BR");
    if (state.sort === "name") rows.sort(cmpName);
    else if (state.sort === "pending") rows.sort((a, b) => (a.r.bought - b.r.bought) || (a.i - b.i));
    else if (state.sort === "value") rows.sort((a, b) => (rowTotal(b.r) || -1) - (rowTotal(a.r) || -1) || (a.i - b.i));
    return rows;
  }

  function itemHTML(r, mIdx) {
    const tot = rowTotal(r);
    const ci = catIdx(r.cat);
    const c = compareInfo(mIdx, r);
    const prevM = mIdx > 0 ? MESES[mIdx - 1] : "";
    const qtyTxt = isNum(r.qty) ? numIn(r.qty) : "—";
    const priceTxt = isNum(r.unit) ? `${qtyTxt} × ${money(r.unit)}` : `Qtd. ${qtyTxt}`;
    const name = r.item.trim() || "Item sem nome";
    return `<li class="item${r.bought ? " done" : ""}" data-id="${r.id}">
      <label class="check" title="${r.bought ? "Desmarcar" : "Marcar como comprado"}">
        <input type="checkbox" data-act="toggle" ${r.bought ? "checked" : ""} aria-label="${esc(name)}: ${r.bought ? "comprado" : "pendente"}. Marcar como ${r.bought ? "pendente" : "comprado"}">
        <span class="box">${icon("check")}</span>
      </label>
      <button type="button" class="item-main" data-act="edit" aria-label="Editar ${esc(name)}">
        <span class="item-name">${esc(name)}</span>
        <span class="item-meta">
          ${r.bought ? `<span class="done-tag">${icon("check")}Comprado</span>` : ""}
          ${state.group ? "" : `<span class="cat"><span class="dot ${ci >= 0 ? CATKEY[ci] : ""}"></span>${esc(ci >= 0 ? CATS[ci] : r.cat || "Sem categoria")}</span>`}
          <span>${priceTxt}</span>
          ${deltaChip(c, prevM)}
        </span>
        <span class="item-total money">${isNum(tot) ? money(tot) : `<span class="noprice">Sem preço</span>`}</span>
        <span class="edit-ic">${icon("pencil", "sm")}</span>
      </button>
    </li>`;
  }

  function renderList() {
    const list = document.getElementById("list");
    if (!list) return;
    const m = state.month, mIdx = MESES.indexOf(m);
    const all = state.months[m];
    const s = summary(m);
    const rows = visibleRows();

    document.getElementById("filterSeg").innerHTML = [["all", "Todos", all.length], ["pend", "Pendentes", s.pending], ["ok", "Comprados", s.bought]]
      .map(([k, l, n]) => `<button type="button" data-filter="${k}" aria-pressed="${state.filter === k}">${l}<span class="c">${n}</span></button>`).join("");
    const cnt = document.getElementById("visibleCount");
    cnt.textContent = rows.length === all.length ? `${all.length} ${all.length === 1 ? "item" : "itens"}` : `${rows.length} de ${all.length} itens`;

    if (!all.length) {
      list.innerHTML = emptyHTML("cart", `Nenhum item em ${m}`, "Adicione o primeiro produto da lista deste mês.", true);
      return;
    }
    if (!rows.length) {
      if (ui.q) list.innerHTML = emptyHTML("search", "Nenhum item encontrado", `Nada com “${esc(ui.q)}” ${state.filter === "all" ? "" : "neste filtro"} em ${m}.`, false, "clear-q", "Limpar busca");
      else if (state.filter === "pend") list.innerHTML = emptyHTML("check", "Tudo comprado", `Todos os itens de ${m} já estão marcados.`, false, "filter-all", "Ver todos");
      else list.innerHTML = emptyHTML("clock", "Nada comprado ainda", `Marque os itens conforme colocar no carrinho.`, false, "filter-all", "Ver todos");
      return;
    }

    if (state.group) {
      const groups = CATS.map((c, i) => ({ c: c, key: CATKEY[i], rows: [] }));
      const other = { c: "Outras", key: "", rows: [] };
      rows.forEach(x => { const ci = catIdx(x.r.cat); (ci >= 0 ? groups[ci] : other).rows.push(x); });
      list.innerHTML = groups.concat([other]).filter(g => g.rows.length).map(g => {
        const done = g.rows.filter(x => x.r.bought).length;
        const spent = g.rows.reduce((t, x) => t + (x.r.bought && isNum(rowTotal(x.r)) ? rowTotal(x.r) : 0), 0);
        return `<section class="group" aria-label="${g.c}">
          <div class="group-head"><span class="dot ${g.key}"></span><h3>${g.c}</h3><span class="meta">${done}/${g.rows.length} · ${money(spent)}</span></div>
          <ul class="items">${g.rows.map(x => itemHTML(x.r, mIdx)).join("")}</ul></section>`;
      }).join("");
    } else {
      list.innerHTML = `<ul class="items">${rows.map(x => itemHTML(x.r, mIdx)).join("")}</ul>`;
    }
  }

  function emptyHTML(ic, title, text, withAdd, act, actLabel) {
    return `<div class="empty"><span class="ic">${icon(ic)}</span><h3>${title}</h3><p>${text}</p>
      ${withAdd ? `<button type="button" class="btn btn-primary" data-act="add">${icon("plus")}Adicionar item</button>` : ""}
      ${act ? `<button type="button" class="btn" data-act="${act}">${actLabel}</button>` : ""}</div>`;
  }

  function renderBar() {
    const m = state.month, s = summary(m);
    const total = s.bought + s.pending;
    const prog = total ? (s.bought / total) * 100 : 0;
    $bar.innerHTML = `
      <div class="sum">
        <div class="top"><b class="money">${money(s.spent)}</b><small>${s.bought}/${total} comprados</small></div>
        <div class="progress" aria-hidden="true"><i style="width:${prog}%"></i></div>
      </div>
      <button type="button" class="btn btn-primary" data-act="add">${icon("plus")}Adicionar</button>`;
  }
  $bar.addEventListener("click", e => { if (e.target.closest('[data-act="add"]')) openItemSheet(null); });

  function refreshMonth() { renderSummary(); renderList(); renderBar(); }

  // popover de meses
  function openMonthPop() {
    const pop = document.getElementById("monthPop"), btn = document.getElementById("monthBtn");
    pop.innerHTML = MESES.map(mm => {
      const s = summary(mm);
      const sub = s.spent > 0 ? money(s.spent) : `${s.bought + s.pending} itens`;
      return `<button type="button" data-month="${mm}" ${mm === state.month ? 'aria-current="true"' : ""}>
        <span class="mn">${MES_ABREV(mm)}${s.bought ? '<span class="dot" aria-hidden="true"></span>' : ""}</span><span class="mv">${sub}</span></button>`;
    }).join("");
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    const cur = pop.querySelector('[aria-current="true"]');
    if (cur) cur.focus();
  }
  function closeMonthPop(focusBtn) {
    const pop = document.getElementById("monthPop"), btn = document.getElementById("monthBtn");
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (focusBtn) btn.focus();
  }
  document.addEventListener("click", e => {
    const pop = document.getElementById("monthPop");
    if (pop && !pop.hidden && !e.target.closest("#monthPop") && !e.target.closest("#monthBtn")) closeMonthPop(false);
  });

  // eventos da tela (delegação)
  $view.addEventListener("click", e => {
    const t = e.target;
    const actEl = t.closest("[data-act]");
    const act = actEl && actEl.dataset.act;
    if (t.closest("#monthBtn")) { const pop = document.getElementById("monthPop"); pop.hidden ? openMonthPop() : closeMonthPop(true); return; }
    const mb = t.closest("[data-month]");
    if (mb && t.closest("#monthPop")) { closeMonthPop(false); go("month", mb.dataset.month); return; }
    const fb = t.closest("[data-filter]");
    if (fb) { state.filter = state.filter === fb.dataset.filter && fb.classList.contains("stat") ? "all" : fb.dataset.filter; savePrefs(); renderList(); return; }
    if (!act || act === "toggle") return;
    const mIdx = MESES.indexOf(state.month);
    if (act === "prev" && mIdx > 0) go("month", MESES[mIdx - 1]);
    else if (act === "next" && mIdx < 11) go("month", MESES[mIdx + 1]);
    else if (act === "edit") openItemSheet(actEl.closest(".item").dataset.id);
    else if (act === "add") openItemSheet(null);
    else if (act === "clear-q") {
      ui.q = "";
      const q = document.getElementById("q");
      if (q) { q.value = ""; q.focus(); }
      const clr = document.querySelector('.search [data-act="clear-q"]');
      if (clr) clr.hidden = true;
      renderList();
    }
    else if (act === "filter-all") { state.filter = "all"; savePrefs(); renderList(); }
    else if (act === "open-data") openDataSheet();
    else if (act === "goto-month") go("month", actEl.dataset.m);
  });
  $view.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.act === "toggle") return toggleItem(t);
    if (t.id === "sortSel") { state.sort = t.value; savePrefs(); renderList(); }
    if (t.id === "groupChk") { state.group = t.checked; savePrefs(); renderList(); }
    if (t.id === "topMonth") { state.topMonth = t.value; savePrefs(); renderYear(); }
  });
  $view.addEventListener("input", e => {
    if (e.target.id !== "q") return;
    ui.q = e.target.value;
    const clr = document.querySelector('.search [data-act="clear-q"]');
    if (clr) clr.hidden = !ui.q;
    renderList();
  });
  $view.addEventListener("keydown", e => {
    if (e.key === "Escape") { const pop = document.getElementById("monthPop"); if (pop && !pop.hidden) closeMonthPop(true); }
  });

  function toggleItem(input) {
    const li = input.closest(".item");
    const r = findRow(state.month, li.dataset.id);
    if (!r) return;
    r.bought = input.checked;
    save();
    li.classList.toggle("done", r.bought);
    const chk = li.querySelector(".check");
    chk.classList.remove("pulse"); void chk.offsetWidth; chk.classList.add("pulse");
    if (navigator.vibrate && r.bought) { try { navigator.vibrate(12); } catch (err) { /* ignora */ } }
    renderSummary(); renderBar();
    const leaves = (state.filter === "pend" && r.bought) || (state.filter === "ok" && !r.bought);
    const id = r.id;
    if (leaves && !reduceMotion()) { li.classList.add("leaving"); setTimeout(() => { renderList(); }, 320); }
    else {
      // atualiza só a linha (mantém o foco no controle)
      setTimeout(() => {
        const mIdx = MESES.indexOf(state.month);
        const cur = document.querySelector(`.item[data-id="${id}"]`);
        if (!cur) return;
        const tmp = document.createElement("ul"); tmp.innerHTML = itemHTML(r, mIdx);
        const fresh = tmp.firstElementChild;
        const hadFocus = document.activeElement && cur.contains(document.activeElement);
        cur.replaceWith(fresh);
        if (hadFocus) fresh.querySelector('[data-act="toggle"]').focus();
        // contadores do filtro e dos grupos
        const s = summary(state.month);
        const seg = document.getElementById("filterSeg");
        if (seg) seg.querySelectorAll("button").forEach(b => {
          const n = b.dataset.filter === "all" ? state.months[state.month].length : b.dataset.filter === "pend" ? s.pending : s.bought;
          b.querySelector(".c").textContent = n;
        });
        if (state.group) {
          const g = fresh.closest(".group");
          if (g) {
            const items = Array.from(g.querySelectorAll(".item")).map(li2 => findRow(state.month, li2.dataset.id)).filter(Boolean);
            const done = items.filter(x => x.bought).length;
            const spent = items.reduce((t, x) => t + (x.bought && isNum(rowTotal(x)) ? rowTotal(x) : 0), 0);
            g.querySelector(".meta").textContent = `${done}/${items.length} · ${money(spent)}`;
          }
        }
      }, 0);
    }
  }

  function findRow(m, id) { return state.months[m].find(r => r.id === id); }

  /* ---------------- Painel (sheet) ---------------- */
  let sheetKind = null, sheetReturn = null;
  function openSheet(kind, html) {
    sheetKind = kind;
    sheetReturn = document.activeElement;
    $sheet.innerHTML = html;
    $layer.hidden = false;
    document.body.classList.add("lock");
  }
  function closeSheet() {
    if ($layer.hidden) return;
    $layer.hidden = true;
    $sheet.innerHTML = "";
    sheetKind = null;
    document.body.classList.remove("lock");
    if (sheetReturn && document.body.contains(sheetReturn)) sheetReturn.focus();
  }
  $layer.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", e => {
    if ($layer.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
    if (e.key === "Tab") { // mantém o foco dentro do painel
      const f = Array.from($sheet.querySelectorAll('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- Adicionar / editar item ---------------- */
  let editing = null; // { id|null, confirmDelete }
  function openItemSheet(id) {
    if (state.view !== "month") go("month");
    const m = state.month, mIdx = MESES.indexOf(m);
    const r = id ? findRow(m, id) : null;
    if (id && !r) return;
    editing = { id: id, confirmDelete: false };
    const lastCat = ui.lastCat && CATS.includes(ui.lastCat) ? ui.lastCat : CATS[0];
    const d = r || { item: "", cat: lastCat, qty: 1, unit: null, bought: false, brand: "", obs: "" };
    const ci = Math.max(0, catIdx(d.cat));
    const moreOpen = !!(d.brand || d.obs);
    openSheet("item", `
      <form id="itemForm" novalidate>
        <div class="sheet-head">
          <h2 id="sheetTitle">${r ? "Editar item" : "Novo item"} <span class="label">· ${m}</span></h2>
          <button type="button" class="icon-btn" data-close aria-label="Fechar">${icon("x")}</button>
        </div>
        <div class="sheet-body">
          <div class="field" id="fw-item">
            <label for="f-item">Nome do produto</label>
            <input class="input big" id="f-item" name="item" autocomplete="off" placeholder="Ex.: Arroz 5 kg" value="${esc(d.item)}" aria-describedby="e-item h-prev">
            <p class="err" id="e-item">${icon("alert", "sm")}<span></span></p>
            <p class="hint" id="h-prev"></p>
          </div>
          <fieldset class="field">
            <legend class="flabel">Categoria</legend>
            <div class="chips">${CATS.map((c, i) => `<label class="chip-opt ${CATKEY[i]}"><input type="radio" name="cat" value="${c}" ${i === ci ? "checked" : ""}><span><span class="dot ${CATKEY[i]}"></span>${c}</span></label>`).join("")}</div>
          </fieldset>
          <div class="row2">
            <div class="field" id="fw-qty">
              <label for="f-qty">Quantidade</label>
              <div class="stepper">
                <button type="button" data-step="-1" aria-label="Diminuir quantidade">${icon("minus")}</button>
                <input id="f-qty" name="qty" inputmode="decimal" autocomplete="off" value="${isNum(d.qty) ? numIn(d.qty) : ""}" aria-describedby="e-qty">
                <button type="button" data-step="1" aria-label="Aumentar quantidade">${icon("plus")}</button>
              </div>
              <p class="err" id="e-qty">${icon("alert", "sm")}<span></span></p>
            </div>
            <div class="field" id="fw-unit">
              <label for="f-unit">Preço unitário <span class="opt">(opcional)</span></label>
              <div class="money-in"><span>R$</span><input id="f-unit" name="unit" inputmode="numeric" autocomplete="off" placeholder="0,00" maxlength="12" value="${isNum(d.unit) ? maskMoney(Math.round(d.unit * 100)) : ""}" aria-describedby="e-unit h-unit"></div>
              <p class="err" id="e-unit">${icon("alert", "sm")}<span></span></p>
              <p class="hint" id="h-unit">Digite só os números: 499 vira 4,99</p>
            </div>
          </div>
          <div class="total-line"><span>Preço total</span><b class="money" id="f-total">—</b></div>
          <div class="compare" id="f-compare" aria-live="polite"></div>
          <label class="switch-row toggle" for="f-bought">
            <span><span class="t">Já comprado</span><span class="s" style="display:block">Marque se o item já está no carrinho</span></span>
            <input type="checkbox" id="f-bought" ${d.bought ? "checked" : ""}><span class="sw"></span>
          </label>
          <details class="more" ${moreOpen ? "open" : ""}>
            <summary>${icon("chevD", "sm")}Marca e observações</summary>
            <div class="inner">
              <div class="field"><label for="f-brand">Marca <span class="opt">(opcional)</span></label><input class="input" id="f-brand" autocomplete="off" placeholder="Ex.: Tio João" value="${esc(d.brand)}"></div>
              <div class="field"><label for="f-obs">Observações <span class="opt">(opcional)</span></label><textarea class="input" id="f-obs" rows="2" placeholder="Ex.: levar o de 1 kg">${esc(d.obs)}</textarea></div>
            </div>
          </details>
        </div>
        <div class="sheet-foot" id="itemFoot"></div>
      </form>`);
    renderItemFoot();
    updateItemPreview();
    const f = document.getElementById("itemForm");
    // máscara de dinheiro: os dígitos entram pela direita (499 → 4,99)
    const unitIn = document.getElementById("f-unit");
    unitIn.addEventListener("input", () => {
      const digits = unitIn.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
      unitIn.value = digits ? maskMoney(Number(digits)) : "";
      const end = unitIn.value.length;
      try { unitIn.setSelectionRange(end, end); } catch (err) { /* ignora */ }
    });
    f.addEventListener("input", e => { clearFieldError(e.target); updateItemPreview(); });
    f.addEventListener("change", updateItemPreview);
    f.addEventListener("submit", e => { e.preventDefault(); submitItem(e.submitter && e.submitter.dataset.more === "1"); });
    f.addEventListener("click", e => {
      const st = e.target.closest("[data-step]");
      if (st) {
        const inp = document.getElementById("f-qty");
        const cur = parseNum(inp.value);
        const next = Math.max(1, Math.round(((isNum(cur) ? cur : 0) + Number(st.dataset.step)) * 100) / 100);
        inp.value = numIn(next); clearFieldError(inp); updateItemPreview();
      }
      const a = e.target.closest("[data-fact]");
      if (a) itemFootAction(a.dataset.fact);
    });
    f.querySelectorAll("input:not([type=radio]):not([type=checkbox]), textarea").forEach(inp => {
      inp.addEventListener("focus", () => { if (isNarrow()) setTimeout(() => inp.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }), 280); });
    });
    setTimeout(() => { const n = document.getElementById("f-item"); if (n && !r) n.focus(); else document.getElementById("sheetTitle").setAttribute("tabindex", "-1"), document.getElementById("sheetTitle").focus(); }, 60);
  }

  function renderItemFoot() {
    const foot = document.getElementById("itemFoot");
    if (!foot) return;
    const r = editing.id ? findRow(state.month, editing.id) : null;
    if (editing.confirmDelete && r) {
      foot.innerHTML = `<p class="confirm-text">Excluir “${esc(r.item || "item sem nome")}” de ${state.month}?</p>
        <button type="button" class="btn" data-fact="cancel-del">Cancelar</button>
        <button type="button" class="btn btn-danger" data-fact="del">${icon("trash")}Excluir</button>`;
      foot.querySelector('[data-fact="cancel-del"]').focus();
      return;
    }
    foot.innerHTML = r
      ? `<button type="button" class="btn btn-danger-quiet" data-fact="ask-del">${icon("trash")}Excluir item</button><span class="grow"></span>
         <button type="button" class="btn" data-close>Cancelar</button>
         <button type="submit" class="btn btn-primary">Salvar</button>`
      : `<button type="submit" class="btn" data-more="1">Salvar e adicionar outro</button><span class="grow"></span>
         <button type="submit" class="btn btn-primary">${icon("plus")}Adicionar</button>`;
  }

  function itemFootAction(a) {
    if (a === "ask-del") { editing.confirmDelete = true; renderItemFoot(); }
    else if (a === "cancel-del") { editing.confirmDelete = false; renderItemFoot(); }
    else if (a === "del") deleteItem(editing.id);
  }

  // centavos (inteiro) → "1.234,56"
  function maskMoney(cents) {
    return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function readItemForm() {
    const v = id => document.getElementById(id);
    const catEl = document.querySelector('#itemForm input[name="cat"]:checked');
    return {
      item: v("f-item").value.trim(),
      cat: catEl ? catEl.value : CATS[0],
      qtyRaw: v("f-qty").value.trim(), unitRaw: v("f-unit").value.trim(),
      qty: parseNum(v("f-qty").value), unit: parseNum(v("f-unit").value),
      bought: v("f-bought").checked,
      brand: v("f-brand").value.trim(), obs: v("f-obs").value.trim()
    };
  }

  function updateItemPreview() {
    if (!document.getElementById("itemForm")) return;
    const f = readItemForm();
    const mIdx = MESES.indexOf(state.month);
    const prevM = mIdx > 0 ? MESES[mIdx - 1] : null;
    const tot = isNum(f.qty) && isNum(f.unit) ? f.qty * f.unit : null;
    document.getElementById("f-total").textContent = isNum(tot) ? money(tot) : "—";
    const prev = prevPrice(mIdx, f.item);
    const hint = document.getElementById("h-prev");
    hint.innerHTML = prevM && f.item && isNum(prev) ? `Em ${prevM} o preço unitário foi <b>${money(prev)}</b>.` : "";
    const box = document.getElementById("f-compare");
    if (!prevM) { box.innerHTML = `<p class="none">Sem dados para comparar: ${state.month} é o primeiro mês do ano.</p>`; return; }
    if (!f.item) { box.innerHTML = `<p class="none">Digite o nome para comparar com ${prevM}.</p>`; return; }
    if (!isNum(prev)) { box.innerHTML = `<p class="none">Sem dados para comparar: “${esc(f.item)}” não tem preço em ${prevM}.</p>`; return; }
    if (!isNum(f.unit)) { box.innerHTML = `<p class="none">Em ${prevM}: <b>${money(prev)}</b> por unidade. Informe o preço atual para ver a variação.</p>`; return; }
    const c = compareInfo(mIdx, { item: f.item, unit: f.unit });
    const word = c.dir === "up" ? "mais caro" : c.dir === "down" ? "mais barato" : "mesmo preço";
    box.innerHTML = `
      <div class="ttl"><span>Comparação com ${prevM}</span>${deltaChip(c, prevM) || ""}</div>
      <dl>
        <div><dt>Anterior</dt><dd class="money">${money(c.prev)}</dd></div>
        <div><dt>Atual</dt><dd class="money">${money(f.unit)}</dd></div>
        <div><dt>Diferença</dt><dd class="money">${c.dir === "eq" ? BRL.format(0) : signed(c.diff)}</dd></div>
      </dl>
      <p class="none">${c.dir === "eq" ? "Mesmo preço por unidade." : `${word.charAt(0).toUpperCase() + word.slice(1)} por unidade${isNum(c.pct) ? ` (${c.diff > 0 ? "+" : "−"}${pctFmt(Math.abs(c.pct))})` : ""}.`}</p>`;
  }

  function setFieldError(name, msg) {
    const w = document.getElementById("fw-" + name);
    w.classList.add("invalid");
    w.querySelector(".err span").textContent = msg;
    const inp = w.querySelector("input");
    inp.setAttribute("aria-invalid", "true");
  }
  function clearFieldError(inp) {
    const w = inp && inp.closest(".field");
    if (w && w.classList.contains("invalid")) { w.classList.remove("invalid"); const i = w.querySelector("input"); if (i) i.removeAttribute("aria-invalid"); }
  }

  function submitItem(addAnother) {
    const f = readItemForm();
    let firstBad = null;
    if (!f.item) { setFieldError("item", "Informe o nome do produto."); firstBad = firstBad || "f-item"; }
    if (!f.qtyRaw) { setFieldError("qty", "Informe a quantidade."); firstBad = firstBad || "f-qty"; }
    else if (!isNum(f.qty)) { setFieldError("qty", "Use só números, ex.: 2 ou 1,5."); firstBad = firstBad || "f-qty"; }
    else if (f.qty <= 0) { setFieldError("qty", "A quantidade precisa ser maior que zero."); firstBad = firstBad || "f-qty"; }
    if (f.unitRaw && !isNum(f.unit)) { setFieldError("unit", "Use só números, ex.: 4,99."); firstBad = firstBad || "f-unit"; }
    else if (isNum(f.unit) && f.unit < 0) { setFieldError("unit", "O preço não pode ser negativo."); firstBad = firstBad || "f-unit"; }
    if (firstBad) { document.getElementById(firstBad).focus(); return; }

    const m = state.month;
    const data = { item: f.item, cat: f.cat, qty: f.qty, unit: isNum(f.unit) ? f.unit : null, bought: f.bought, brand: f.brand, obs: f.obs };
    ui.lastCat = f.cat;
    if (editing.id) {
      const r = findRow(m, editing.id);
      if (!r) { closeSheet(); return; }
      Object.assign(r, data);
      save();
      closeSheet();
      refreshMonth();
      flashItem(r.id);
      toast("Item salvo.");
    } else {
      const r = Object.assign({ id: newId() }, data);
      state.months[m].push(r);
      save();
      refreshMonth();
      if (addAnother) {
        toast(`“${r.item}” adicionado.`);
        const keepCat = f.cat;
        ["f-item", "f-unit", "f-brand", "f-obs"].forEach(id => { document.getElementById(id).value = ""; });
        document.getElementById("f-qty").value = "1";
        document.getElementById("f-bought").checked = false;
        const radio = document.querySelector(`#itemForm input[name="cat"][value="${keepCat}"]`);
        if (radio) radio.checked = true;
        updateItemPreview();
        document.getElementById("f-item").focus();
      } else {
        closeSheet();
        // garante que o item novo fique visível
        if ((state.filter === "ok" && !r.bought) || (state.filter === "pend" && r.bought) || (ui.q && !fold(r.item).includes(fold(ui.q)))) {
          state.filter = "all"; ui.q = ""; savePrefs(); renderMonth();
        }
        flashItem(r.id, true);
        toast(`“${r.item}” adicionado.`);
      }
    }
  }

  function flashItem(id, scroll) {
    const el = document.querySelector(`.item[data-id="${id}"]`);
    if (!el) return;
    if (scroll) el.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" });
    el.animate && !reduceMotion() && el.animate([{ background: "var(--brand-soft)" }, { background: "transparent" }], { duration: 1100, easing: "ease-out" });
  }

  function deleteItem(id) {
    const m = state.month;
    const idx = state.months[m].findIndex(r => r.id === id);
    if (idx < 0) { closeSheet(); return; }
    const [removed] = state.months[m].splice(idx, 1);
    save();
    closeSheet();
    refreshMonth();
    toast(`“${removed.item || "Item"}” excluído.`, {
      action: "Desfazer",
      onAction: () => {
        state.months[m].splice(Math.min(idx, state.months[m].length), 0, removed);
        save();
        if (state.month === m && state.view === "month") { refreshMonth(); flashItem(removed.id); }
        toast("Item restaurado.");
      }
    });
  }

  /* ---------------- Painel de dados ---------------- */
  let dataNote = null, confirmReset = false;
  function openDataSheet() {
    dataNote = null; confirmReset = false;
    openSheet("data", `<div class="sheet-head"><h2 id="sheetTitle">Banco de dados</h2><button type="button" class="icon-btn" data-close aria-label="Fechar">${icon("x")}</button></div>
      <div class="sheet-body" id="dataBody"></div>`);
    renderDataSheet();
    setTimeout(() => { const b = $sheet.querySelector("[data-close]"); if (b) b.focus(); }, 60);
  }
  function renderDataSheet() {
    const body = document.getElementById("dataBody");
    if (!body || !state) return;
    const total = MESES.reduce((n, m) => n + state.months[m].length, 0);
    const mode = {
      server: [icon("server"), `Gravando no arquivo <b>db.json</b> da pasta do sistema, pelo servidor local. No celular, abra o mesmo endereço na mesma rede Wi-Fi. A versão anterior fica em <b>db.backup.json</b>.`],
      file: [icon("file"), `Gravando direto no arquivo <b>${esc(DB.fileName)}</b> que você conectou. Ao reabrir o sistema, conecte o arquivo de novo.`],
      local: [icon("browser"), `Sem servidor: os dados ficam guardados neste navegador. Para gravar em arquivo, rode <code>node server.js</code> na pasta do sistema${canPickFile ? " ou conecte um db.json abaixo" : ""}. Use <b>Exportar</b> para guardar uma cópia.`]
    }[DB.mode];
    body.innerHTML = `
      <div class="data-mode"><span class="stat-ic green">${mode[0]}</span><div>
        <p style="color:var(--ink);font-weight:600;margin-bottom:2px">${MODE_LABEL[DB.mode]} · ${total} itens de compras · ${Object.keys(state.faxina.semanas).length} ${Object.keys(state.faxina.semanas).length === 1 ? "semana" : "semanas"} de faxina</p>
        <p>${mode[1]}</p>
        ${DB.updatedAt ? `<p style="margin-top:6px">Última gravação: <b>${timeLabel(DB.updatedAt)}</b></p>` : ""}
      </div></div>
      ${DB.status === "err" ? `<p class="note err">${esc(DB.msg)} <button type="button" class="btn" data-dact="retry" style="margin-left:6px;min-height:34px">${icon("refresh", "sm")}Tentar de novo</button></p>` : ""}
      ${DB.readonly ? `<p class="note err">O db.json não pôde ser lido, então nada será gravado por cima dele. Corrija o arquivo ou importe um válido e recarregue a página.</p>` : ""}
      ${dataNote ? `<p class="note ${dataNote.err ? "err" : "ok"}">${esc(dataNote.msg)}</p>` : ""}
      <div class="data-actions">
        <button type="button" class="btn" data-dact="export">${icon("download")}Exportar db.json</button>
        <label class="btn file-btn">${icon("upload")}Importar db.json<input type="file" id="importFile" accept=".json,application/json"></label>
        ${DB.mode !== "server" && canPickFile ? `
          <button type="button" class="btn" data-dact="open-file">${icon("file")}Abrir db.json</button>
          <button type="button" class="btn" data-dact="new-file">${icon("file")}Salvar como db.json</button>` : ""}
      </div>
      <div class="danger-zone">
        ${confirmReset
          ? `<p style="color:var(--red-ink);font-weight:600">Apagar todas as alterações e voltar aos dados originais da planilha?</p>
             <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-dact="reset-no">Cancelar</button><button type="button" class="btn btn-danger" data-dact="reset-yes">Restaurar dados</button></div>`
          : `<p>Voltar todos os meses aos dados originais da planilha.</p>
             <div><button type="button" class="btn btn-danger-quiet" data-dact="reset">${icon("refresh")}Restaurar dados da planilha</button></div>`}
      </div>`;
  }

  async function adoptData(data, origem) {
    const months = fromDB(data);
    state.months = months;
    const fx = fromFaxina(data);
    if (fx) state.faxina = fx;
    DB.readonly = false;
    DB.lastSaved = "";
    dataNote = { msg: `${origem}: ${MESES.reduce((n, m) => n + months[m].length, 0)} itens carregados.` };
    render();
    await flush();
  }
  function exportDB() {
    const blob = new Blob([JSON.stringify(toDB(state.months), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "db.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    dataNote = { msg: "db.json exportado para a pasta de downloads." };
    renderDataSheet();
  }
  $sheet.addEventListener("change", async e => {
    if (e.target.id !== "importFile" || !e.target.files[0]) return;
    try {
      const data = JSON.parse(await e.target.files[0].text());
      await adoptData(data, "Importado");
      toast("Banco importado.");
    } catch (err) {
      dataNote = { err: true, msg: "Arquivo inválido: " + err.message + ". Nada foi alterado." };
    }
    renderDataSheet();
  });
  $sheet.addEventListener("click", async e => {
    const b = e.target.closest("[data-dact]");
    if (!b) return;
    const a = b.dataset.dact;
    try {
      if (a === "export") exportDB();
      else if (a === "retry") { DB.lastSaved = ""; await flush(); }
      else if (a === "reset") { confirmReset = true; renderDataSheet(); }
      else if (a === "reset-no") { confirmReset = false; renderDataSheet(); }
      else if (a === "reset-yes") {
        confirmReset = false;
        state.months = seed().months;
        DB.readonly = false;
        DB.lastSaved = "";
        dataNote = { msg: "Dados da planilha restaurados." };
        render();
        await flush();
        renderDataSheet();
      } else if (a === "open-file") {
        const [h] = await window.showOpenFilePicker({ types: [{ description: "Banco JSON", accept: { "application/json": [".json"] } }] });
        const text = await (await h.getFile()).text();
        const data = text.trim() ? JSON.parse(text) : toDB(state.months);
        const months = fromDB(data); // valida antes de trocar o destino
        DB.mode = "file"; DB.handle = h; DB.fileName = h.name;
        state.months = months; DB.lastSaved = ""; DB.readonly = false;
        const fx = fromFaxina(data); if (fx) state.faxina = fx;
        dataNote = { msg: `Conectado a ${h.name}.` };
        render(); await flush(); renderStatus(); renderDataSheet();
      } else if (a === "new-file") {
        const h = await window.showSaveFilePicker({ suggestedName: "db.json", types: [{ description: "Banco JSON", accept: { "application/json": [".json"] } }] });
        DB.mode = "file"; DB.handle = h; DB.fileName = h.name; DB.lastSaved = "";
        dataNote = { msg: `Banco salvo em ${h.name}. As próximas alterações vão para esse arquivo.` };
        await flush(); renderStatus(); renderDataSheet();
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      dataNote = { err: true, msg: err.message };
      renderDataSheet();
    }
  });

  /* ---------------- Visão do ano ---------------- */
  function renderYear() {
    const sums = MESES.map(m => ({ m: m, s: summary(m) }));
    const annual = { spent: 0, bought: 0, pending: 0, cats: [0, 0, 0, 0] };
    sums.forEach(x => { annual.spent += x.s.spent; annual.bought += x.s.bought; annual.pending += x.s.pending; x.s.cats.forEach((v, i) => { annual.cats[i] += v; }); });
    const active = sums.filter(x => x.s.spent > 0);
    const maxM = active.reduce((a, x) => (!a || x.s.spent > a.s.spent ? x : a), null);
    const minM = active.reduce((a, x) => (!a || x.s.spent < a.s.spent ? x : a), null);
    const avg = active.length ? annual.spent / active.length : 0;
    const maxSpent = maxM ? maxM.s.spent : 0;
    const tm = MESES.includes(state.topMonth) ? state.topMonth : state.month;
    const top = state.months[tm].map(r => ({ r: r, t: rowTotal(r) })).filter(x => isNum(x.t) && norm(x.r.item)).sort((a, b) => b.t - a.t).slice(0, 5);

    const bars = sums.map(x => {
      const w = maxSpent ? (x.s.spent / maxSpent) * 100 : 0;
      const segs = x.s.cats.map((v, i) => (v > 0 ? `<i class="${CATKEY[i]}" style="width:${(v / x.s.spent) * w}%"></i>` : "")).join("");
      return `<button type="button" class="bar-row${x.s.spent > 0 ? "" : " zero"}" data-act="goto-month" data-m="${x.m}" aria-label="Abrir ${x.m}: ${money(x.s.spent)} gastos">
        <span class="m">${MES_ABREV(x.m)}</span><span class="track">${segs}</span><span class="v money">${money(x.s.spent)}</span></button>`;
    }).join("");

    $view.innerHTML = `
      <div class="${monthAnim || "fade-in"}">
      <div class="year-head"><div><h1>Resumo de 2026</h1><p>Gastos de itens comprados em todos os meses. Toque em um mês para abrir a lista.</p></div></div>
      <div class="year-grid">
        <div class="kpis full">
          <div class="card kpi main"><p class="label">Total gasto no ano</p><p class="v money">${money(annual.spent)}</p><p class="s">${annual.bought} itens comprados · ${annual.pending} pendentes</p></div>
          <div class="card kpi"><p class="label">Maior mês</p><p class="v money">${money(maxM ? maxM.s.spent : 0)}</p><p class="s">${maxM ? maxM.m : "Sem compras"}</p></div>
          <div class="card kpi"><p class="label">Menor mês</p><p class="v money">${money(minM ? minM.s.spent : 0)}</p><p class="s">${minM ? minM.m : "Sem compras"}</p></div>
          <div class="card kpi"><p class="label">Média mensal</p><p class="v money">${money(avg)}</p><p class="s">${active.length} ${active.length === 1 ? "mês" : "meses"} com gasto</p></div>
        </div>
        <section class="card panel">
          <h2>Evolução dos gastos <small>por categoria</small></h2>
          <div class="bars">${bars}</div>
          <div class="legend">${CATS.map((c, i) => `<span><span class="dot ${CATKEY[i]}"></span>${c}</span>`).join("")}</div>
        </section>
        <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
          <section class="card panel">
            <h2>5 itens mais caros
              <span><label class="sr-only" for="topMonth">Mês</label><select class="select" id="topMonth" style="min-height:38px">${MESES.map(m => `<option${m === tm ? " selected" : ""}>${m}</option>`).join("")}</select></span>
            </h2>
            ${top.length ? `<div class="tbl-wrap"><table class="top5">
              <thead><tr><th>#</th><th>Item</th><th class="n">Preço total</th><th class="catcol">Categoria</th></tr></thead>
              <tbody>${top.map((x, i) => { const ci = catIdx(x.r.cat); return `<tr><td class="rank">${i + 1}º</td><td>${esc(x.r.item)}</td><td class="n money">${money(x.t)}</td><td class="catcol"><span class="catname"><span class="dot ${ci >= 0 ? CATKEY[ci] : ""}"></span>${esc(ci >= 0 ? CATS[ci] : x.r.cat)}</span></td></tr>`; }).join("")}</tbody>
            </table></div>` : `<p class="label">Nenhum item com preço em ${tm}.</p>`}
          </section>
          <section class="card panel">
            <h2>Gasto por categoria</h2>
            <div class="tbl-wrap"><table class="cats">
              <thead><tr><th>Categoria</th><th class="n">Total</th><th class="n">% do total</th><th class="n avg">Média mensal</th></tr></thead>
              <tbody>${CATS.map((c, i) => {
                const share = annual.spent > 0 ? annual.cats[i] / annual.spent : null;
                return `<tr><td><span class="catname"><span class="dot ${CATKEY[i]}"></span>${c}</span><div class="share"><i class="${CATKEY[i]}" style="width:${share ? share * 100 : 0}%"></i></div></td>
                  <td class="n money">${money(annual.cats[i])}</td><td class="n">${pct(share)}</td><td class="n avg money">${active.length ? money(annual.cats[i] / active.length) : "—"}</td></tr>`;
              }).join("")}</tbody>
              <tfoot><tr><td>Total</td><td class="n money">${money(annual.spent)}</td><td class="n">${annual.spent > 0 ? "100%" : "—"}</td><td class="avg"></td></tr></tfoot>
            </table></div>
          </section>
        </div>
        <section class="card panel full">
          <h2>Resumo mensal</h2>
          <div class="tbl-wrap"><table class="resumo clickable">
            <thead><tr><th>Mês</th><th class="n">Total gasto</th><th class="n">Comprados</th><th class="n">Pendentes</th>${CATS.map(c => `<th class="n">${c}</th>`).join("")}</tr></thead>
            <tbody>${sums.map(x => `<tr data-act="goto-month" data-m="${x.m}" tabindex="0">
              <td class="m-name">${x.m}</td><td class="n money">${money(x.s.spent)}</td>
              <td class="n wide">${x.s.bought}</td><td class="n wide">${x.s.pending}</td>
              <td class="m-cnt">${x.s.bought} comprados · ${x.s.pending} pendentes</td>
              ${x.s.cats.map(v => `<td class="n wide money">${money(v)}</td>`).join("")}
              <td class="mix">${x.s.cats.map((v, i) => (v > 0 ? `<i class="${CATKEY[i]}" style="width:${(v / x.s.spent) * 100}%"></i>` : "")).join("")}</td>
            </tr>`).join("")}</tbody>
            <tfoot><tr><td class="m-name">Total anual</td><td class="n money">${money(annual.spent)}</td><td class="n wide">${annual.bought}</td><td class="n wide">${annual.pending}</td>
              <td class="m-cnt">${annual.bought} comprados · ${annual.pending} pendentes</td>${annual.cats.map(v => `<td class="n wide money">${money(v)}</td>`).join("")}<td class="mix"></td></tr></tfoot>
          </table></div>
        </section>
      </div></div>`;
    monthAnim = "";
  }
  $view.addEventListener("keydown", e => {
    const tr = e.target.closest && e.target.closest('tr[data-act="goto-month"]');
    if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go("month", tr.dataset.m); }
  });

  /* ---------------- Divisão de faxina ----------------
   * Cada semana (segunda a domingo) tem sua lista. Peso: pesada 3, média 2, leve 1.
   * Responsável: uma das pessoas, "Juntos" ou ninguém. Situação: pendente, feita ou "não fez".
   * Pontos de uma pessoa = soma dos pesos das tarefas dela marcadas como feitas.
   * Tarefas fixas são copiadas para cada nova semana criada.
   */
  Object.assign(ICONS, {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'
  });

  const PESOS = [
    { v: 3, label: "Pesada", plural: "Pesadas" },
    { v: 2, label: "Média", plural: "Médias" },
    { v: 1, label: "Leve", plural: "Leves" }
  ];
  const JUNTOS = "Juntos";
  const STATUS_LABEL = { pendente: "Pendente", feito: "Feita", naofez: "Não fez" };
  const pts = n => `${n} ${n === 1 ? "pt" : "pts"}`;

  // semanas de segunda a domingo, no horário local
  const pad2 = n => String(n).padStart(2, "0");
  const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const parseIso = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDays = (s, n) => { const d = parseIso(s); d.setDate(d.getDate() + n); return isoDate(d); };
  const thisWeek = () => isoDate(mondayOf(new Date()));
  const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function weekLabel(s) {
    const a = parseIso(s), b = parseIso(addDays(s, 6));
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()} a ${b.getDate()} de ${MES_CURTO[b.getMonth()]}`
      : `${a.getDate()} ${MES_CURTO[a.getMonth()]} a ${b.getDate()} ${MES_CURTO[b.getMonth()]}`;
  }
  function weekTitle(s) {
    const cur = thisWeek();
    if (s === cur) return "Esta semana";
    if (s === addDays(cur, -7)) return "Semana passada";
    if (s === addDays(cur, 7)) return "Próxima semana";
    return parseIso(s) < parseIso(cur) ? "Semana anterior" : "Semana futura";
  }

  // lista da imagem enviada (semana de 5 a 11 de outubro de 2026)
  function seedFaxina() {
    const G = "Gabriel", L = "Letícia", J = JUNTOS;
    const T = [
      ["Varrer casa", 3, G, "pendente"], ["Passar pano", 3, G, "naofez"], ["Lavar banheiro", 3, L, "pendente"],
      ["Lavar os panos de chão", 3, G, "naofez"], ["Lavar roupa e toalha", 3, L, "pendente"],
      ["Limpar airfryer", 2, G, "naofez"], ["Guardar feira", 2, "", "pendente"], ["Lavar louça", 2, L, "pendente"],
      ["Fazer feijão", 2, L, "pendente"], ["Limpar fogão", 1, L, "pendente"], ["Juntar lixo", 1, G, "pendente"],
      ["Limpar pia", 1, "", "pendente"], ["Mistura da semana", 1, G, "pendente"], ["Guardar louça", 1, L, "pendente"],
      ["Pegar coisas pela casa", 1, G, "pendente"], ["Lavar roupa", 2, J, "pendente"], ["Organizar guarda-roupa", 1, J, "pendente"]
    ];
    const fixas = [], semana = [];
    T.forEach(([nome, peso, resp, st]) => {
      const fid = newId();
      fixas.push({ id: fid, nome: nome, peso: peso, juntos: resp === J });
      semana.push({ id: newId(), fixaId: fid, nome: nome, peso: peso, responsavel: resp, status: st });
    });
    return { pessoas: [G, L], tarefasFixas: fixas, semanas: { "2026-10-05": semana } };
  }
  function fromFaxina(data) {
    const f = data && data.faxina;
    if (!f || typeof f !== "object") return null;
    const pessoas = Array.isArray(f.pessoas) && f.pessoas.length >= 2 ? f.pessoas.slice(0, 2).map(String) : ["Gabriel", "Letícia"];
    const okPeso = v => ([1, 2, 3].includes(Number(v)) ? Number(v) : 1);
    const okResp = v => (v === JUNTOS || pessoas.includes(v) ? v : "");
    const okSt = v => (["pendente", "feito", "naofez"].includes(v) ? v : "pendente");
    const tarefasFixas = (Array.isArray(f.tarefasFixas) ? f.tarefasFixas : []).map(t => ({
      id: String(t.id || newId()), nome: String(t.nome || ""), peso: okPeso(t.peso), juntos: !!t.juntos
    }));
    const semanas = {};
    if (f.semanas && typeof f.semanas === "object") {
      Object.keys(f.semanas).forEach(k => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !Array.isArray(f.semanas[k])) return;
        semanas[k] = f.semanas[k].map(t => ({
          id: String(t.id || newId()), fixaId: t.fixaId ? String(t.fixaId) : null, nome: String(t.nome || ""),
          peso: okPeso(t.peso), responsavel: okResp(t.responsavel), status: okSt(t.status)
        }));
      });
    }
    return { pessoas: pessoas, tarefasFixas: tarefasFixas, semanas: semanas };
  }

  const fxWeek = w => state.faxina.semanas[w || state.week] || null;
  function fxScore(list) {
    const P = state.faxina.pessoas;
    const s = { per: {}, juntos: { total: 0, n: 0, done: 0 }, sem: 0, semPts: 0, total: list.length, feitas: 0, naofez: 0 };
    P.forEach(p => { s.per[p] = { atrib: 0, feito: 0, n: 0, done: 0, naofez: 0 }; });
    list.forEach(t => {
      if (t.status === "feito") s.feitas++;
      if (t.status === "naofez") s.naofez++;
      if (t.responsavel === JUNTOS) { s.juntos.total += t.peso; s.juntos.n++; if (t.status === "feito") s.juntos.done++; return; }
      const r = s.per[t.responsavel];
      if (!r) { s.sem++; s.semPts += t.peso; return; }
      r.atrib += t.peso; r.n++;
      if (t.status === "feito") { r.feito += t.peso; r.done++; }
      if (t.status === "naofez") r.naofez++;
    });
    return s;
  }

  // divide as tarefas pendentes equilibrando os pontos atribuídos
  function fxDivide(list, onlyUnassigned) {
    const P = state.faxina.pessoas;
    const load = {};
    P.forEach(p => { load[p] = 0; });
    const movable = [];
    list.forEach(t => {
      if (t.responsavel === JUNTOS) return;
      if (t.status === "pendente" && (!onlyUnassigned || !t.responsavel)) movable.push(t);
      else if (load[t.responsavel] != null) load[t.responsavel] += t.peso;
    });
    const order = movable.map(t => ({ t: t, r: Math.random() })).sort((a, b) => b.t.peso - a.t.peso || a.r - b.r).map(x => x.t);
    order.forEach(t => {
      const min = Math.min.apply(null, P.map(p => load[p]));
      const cands = P.filter(p => load[p] === min);
      const p = cands[Math.floor(Math.random() * cands.length)];
      t.responsavel = p;
      load[p] += t.peso;
    });
    // ajuste fino: move ou troca tarefas se isso aproximar os pontos
    for (let guard = 0; guard < 60; guard++) {
      const [a, b] = P;
      const D = Math.abs(load[a] - load[b]);
      if (D <= 1) break;
      const big = load[a] > load[b] ? a : b, small = big === a ? b : a;
      const mine = order.filter(t => t.responsavel === big), theirs = order.filter(t => t.responsavel === small);
      const mv = mine.find(t => Math.abs(D - 2 * t.peso) < D);
      if (mv) { mv.responsavel = small; load[big] -= mv.peso; load[small] += mv.peso; continue; }
      let swapped = false;
      for (const x of mine) {
        for (const y of theirs) {
          const delta = x.peso - y.peso;
          if (delta > 0 && Math.abs(D - 2 * delta) < D) { x.responsavel = small; y.responsavel = big; load[big] -= delta; load[small] += delta; swapped = true; break; }
        }
        if (swapped) break;
      }
      if (!swapped) break;
    }
    return order.length;
  }

  /* ----- módulo (seletor no topo) ----- */
  const MODULES = {
    compras: { name: "Controle de Compras", short: "Compras", sub: "Lista do mercado e gastos do mês", icon: "cart" },
    faxina: { name: "Divisão de Faxina", short: "Faxina", sub: "Tarefas da casa divididas por pontos", icon: "sparkle" }
  };
  const $modBtn = document.getElementById("modBtn");
  const $modPop = document.getElementById("modPop");
  function renderModule() {
    const m = MODULES[state.module];
    document.getElementById("modMark").innerHTML = icon(m.icon);
    document.getElementById("modName").innerHTML = `<span class="long">${m.name}</span><span class="short">${m.short}</span>${state.module === "compras" ? ' <span class="yr">2026</span>' : ""}`;
    $modBtn.setAttribute("aria-label", `${m.name}. Trocar de área`);
    document.title = m.name + (state.module === "compras" ? " 2026" : "");
  }
  function openModPop() {
    $modPop.innerHTML = Object.keys(MODULES).map(k => `
      <button type="button" role="menuitemradio" aria-checked="${k === state.module}" data-module="${k}">
        <span class="brand-mark sm" aria-hidden="true">${icon(MODULES[k].icon)}</span>
        <span><b>${MODULES[k].name}</b><small>${MODULES[k].sub}</small></span>
        ${k === state.module ? icon("check", "sm") : "<span></span>"}
      </button>`).join("");
    $modPop.hidden = false;
    $modBtn.setAttribute("aria-expanded", "true");
    const cur = $modPop.querySelector('[aria-checked="true"]');
    if (cur) cur.focus();
  }
  function closeModPop(focusBtn) {
    if ($modPop.hidden) return;
    $modPop.hidden = true;
    $modBtn.setAttribute("aria-expanded", "false");
    if (focusBtn) $modBtn.focus();
  }
  $modBtn.addEventListener("click", () => ($modPop.hidden ? openModPop() : closeModPop(true)));
  $modPop.addEventListener("click", e => {
    const b = e.target.closest("[data-module]");
    if (!b) return;
    closeModPop(false);
    if (b.dataset.module === state.module) return;
    state.module = b.dataset.module;
    monthAnim = "fade-in";
    savePrefs();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    $modBtn.focus();
  });
  document.addEventListener("click", e => { if (!$modPop.hidden && !e.target.closest("#modPop") && !e.target.closest("#modBtn")) closeModPop(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$modPop.hidden) closeModPop(true); });

  /* ----- navegação da faxina ----- */
  function fxGo(view, week) {
    if (week) {
      monthAnim = week > state.week ? "slide-l" : week < state.week ? "slide-r" : "fade-in";
      state.week = week;
    } else monthAnim = "fade-in";
    state.fxView = view;
    savePrefs();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  function fxRender() {
    if (state.fxView === "hist") fxRenderHist();
    else fxRenderWeek();
  }
  function fxRefresh() {
    if (!document.getElementById("fxList")) { render(); return; }
    fxRenderSummary(); fxRenderList(); fxRenderBar();
  }

  function fxRenderWeek() {
    const w = state.week, list = fxWeek(w), cur = thisWeek();
    const head = `
      ${bannerHTML()}
      <div class="monthbar">
        <button type="button" class="icon-btn" data-act="fx-prev" aria-label="Semana anterior">${icon("chevL")}</button>
        <div class="week-title"><span class="eyebrow">${weekTitle(w)}</span><h1>${weekLabel(w)}</h1></div>
        <button type="button" class="icon-btn" data-act="fx-next" aria-label="Próxima semana">${icon("chevR")}</button>
        <span class="spacer"></span>
        ${w !== cur ? `<button type="button" class="btn btn-quiet" data-act="fx-today">${icon("calendar", "sm")}Esta semana</button>` : ""}
      </div>`;
    if (!list) {
      const n = state.faxina.tarefasFixas.length;
      $view.innerHTML = head + `<div class="empty ${monthAnim}">
        <span class="ic">${icon("calendar")}</span>
        <h3>Semana de ${weekLabel(w)} ainda sem lista</h3>
        <p>${n ? `As ${n} tarefas fixas serão copiadas para esta semana. As marcadas como “Juntos” continuam juntas.` : "Ainda não há tarefas fixas. Crie a lista e adicione as tarefas."}</p>
        <div class="empty-actions">
          ${n ? `<button type="button" class="btn btn-primary" data-act="fx-create" data-divide="1">${icon("shuffle")}Criar e dividir</button>
                 <button type="button" class="btn" data-act="fx-create" data-divide="0">Criar sem dividir</button>`
              : `<button type="button" class="btn btn-primary" data-act="fx-create" data-divide="0">${icon("plus")}Criar lista</button>`}
        </div></div>`;
      monthAnim = "";
      return;
    }
    $view.innerHTML = head + `
      <div class="month-layout ${monthAnim}">
        <aside class="summary" id="fxSummary" aria-label="Placar da semana"></aside>
        <section class="listsec" aria-labelledby="fxTitle">
          <div class="listhead"><h2 id="fxTitle">Tarefas da semana</h2><span class="count" id="fxCount" aria-live="polite"></span></div>
          <div class="controls"><div class="seg fx-seg" id="fxSeg" role="group" aria-label="Mostrar tarefas de"></div></div>
          <div class="list" id="fxList"></div>
        </section>
      </div>`;
    monthAnim = "";
    fxRenderSummary();
    fxRenderList();
  }

  const avatarHTML = (resp, extra) => {
    const P = state.faxina.pessoas, i = P.indexOf(resp);
    if (resp === JUNTOS) return `<span class="avatar pj${extra || ""}" aria-hidden="true">${icon("users")}</span>`;
    if (i >= 0) return `<span class="avatar p${i + 1}${extra || ""}" aria-hidden="true">${esc(resp.charAt(0))}</span>`;
    return `<span class="avatar pn${extra || ""}" aria-hidden="true">?</span>`;
  };

  function fxRenderSummary() {
    const el = document.getElementById("fxSummary");
    if (!el) return;
    const list = fxWeek(), s = fxScore(list), P = state.faxina.pessoas;
    const [a, b] = P;
    const diff = s.per[a].atrib - s.per[b].atrib;
    const bal = Math.abs(diff) <= 1
      ? `<span class="bal ok">${icon("check", "sm")}Divisão equilibrada</span>`
      : `<span class="bal warn">${icon("alert", "sm")}${esc(diff > 0 ? a : b)} com ${pts(Math.abs(diff))} a mais</span>`;
    const prog = s.total ? (s.feitas / s.total) * 100 : 0;
    el.innerHTML = `
      <section class="card hero">
        <div class="hero-top"><p class="label">Placar da semana</p>${bal}</div>
        <div class="people">
          ${P.map((p, i) => {
            const r = s.per[p];
            const pr = r.atrib ? (r.feito / r.atrib) * 100 : 0;
            return `<div class="person p${i + 1}">
              <div class="person-head">${avatarHTML(p)}<b>${esc(p)}</b></div>
              <p class="score"><span class="big-n">${r.feito}</span><span class="of">de ${pts(r.atrib)}</span></p>
              <div class="progress" role="progressbar" aria-label="Pontos feitos por ${esc(p)}" aria-valuemin="0" aria-valuemax="${r.atrib}" aria-valuenow="${r.feito}"><i style="width:${pr}%"></i></div>
              <p class="person-sub">${r.done} de ${r.n} feitas${r.naofez ? ` · <span class="nf">${r.naofez} não fez</span>` : ""}</p>
            </div>`;
          }).join("")}
        </div>
        <div>
          <div class="progress" aria-hidden="true"><i style="width:${prog}%"></i></div>
          <div class="progress-row"><span><b>${s.feitas}</b> de ${s.total} tarefas feitas</span><span>${Math.round(prog)}%</span></div>
        </div>
        ${s.juntos.n ? `<p class="planned">${icon("users", "sm")} Juntos: <b>${s.juntos.done} de ${s.juntos.n}</b> feitas · ${pts(s.juntos.total)}</p>` : ""}
        ${s.sem ? `<p class="unassigned">${icon("alert", "sm")}${s.sem} ${s.sem === 1 ? "tarefa sem responsável" : "tarefas sem responsável"} · ${pts(s.semPts)}</p>` : ""}
        <button type="button" class="btn ${s.sem ? "btn-primary" : ""}" data-act="fx-divide">${icon("shuffle")}Sugerir divisão</button>
      </section>
      <section class="card legend-card" aria-label="Pesos">
        ${PESOS.map(p => `<span><span class="wdot w${p.v}"></span><b>${p.label}</b> ${pts(p.v)}</span>`).join("")}
      </section>`;
  }

  function fxItemHTML(t) {
    const P = state.faxina.pessoas;
    const who = t.responsavel === JUNTOS ? "Juntos" : P.includes(t.responsavel) ? t.responsavel : "";
    const tag = t.status === "feito" ? `<span class="done-tag">${icon("check")}Feita</span>`
      : t.status === "naofez" ? `<span class="nf-tag">${icon("x")}Não fez</span>` : "";
    const name = t.nome.trim() || "Tarefa sem nome";
    return `<li class="item${t.status === "feito" ? " done" : ""}${t.status === "naofez" ? " missed" : ""}" data-id="${t.id}">
      <label class="check" title="${t.status === "feito" ? "Desmarcar" : "Marcar como feita"}">
        <input type="checkbox" data-act="fx-toggle" ${t.status === "feito" ? "checked" : ""} aria-label="${esc(name)}: ${STATUS_LABEL[t.status].toLowerCase()}. Marcar como ${t.status === "feito" ? "pendente" : "feita"}">
        <span class="box">${icon("check")}</span>
      </label>
      <button type="button" class="item-main" data-act="fx-edit" aria-label="Editar ${esc(name)}">
        <span class="item-name">${esc(name)}</span>
        <span class="item-meta">${tag}<span class="wtag"><span class="wdot w${t.peso} sm"></span>${pts(t.peso)}</span>${t.fixaId ? "" : `<span>Só esta semana</span>`}</span>
        <span class="item-total"><span class="who${who ? "" : " none"}">${avatarHTML(t.responsavel)}<span class="nm">${who ? esc(who) : "Sem resp."}</span></span></span>
        <span class="edit-ic">${icon("pencil", "sm")}</span>
      </button>
    </li>`;
  }

  function fxRenderList() {
    const el = document.getElementById("fxList");
    if (!el) return;
    const list = fxWeek(), P = state.faxina.pessoas, s = fxScore(list);
    const opts = [["all", "Todas", list.length]].concat(P.map(p => [p, p, s.per[p].n]), [[JUNTOS, "Juntos", s.juntos.n]]);
    if (s.sem) opts.push(["none", "Sem resp.", s.sem]);
    if (!opts.some(o => o[0] === state.fxFilter)) state.fxFilter = "all";
    document.getElementById("fxSeg").innerHTML = opts.map(([k, l, n]) =>
      `<button type="button" data-fxfilter="${esc(k)}" aria-pressed="${state.fxFilter === k}">${esc(l)}<span class="c">${n}</span></button>`).join("");
    const f = state.fxFilter;
    const rows = list.filter(t => f === "all" || (f === "none" ? !t.responsavel : t.responsavel === f));
    document.getElementById("fxCount").textContent = rows.length === list.length ? `${list.length} ${list.length === 1 ? "tarefa" : "tarefas"}` : `${rows.length} de ${list.length} tarefas`;
    if (!list.length) {
      el.innerHTML = `<div class="empty"><span class="ic">${icon("sparkle")}</span><h3>Nenhuma tarefa nesta semana</h3><p>Adicione as tarefas da casa e defina o peso de cada uma.</p>
        <button type="button" class="btn btn-primary" data-act="fx-add">${icon("plus")}Adicionar tarefa</button></div>`;
      return;
    }
    if (!rows.length) {
      el.innerHTML = `<div class="empty"><span class="ic">${icon("users")}</span><h3>Nenhuma tarefa neste filtro</h3><p>Não há tarefas para essa opção nesta semana.</p>
        <button type="button" class="btn" data-act="fx-all">Ver todas</button></div>`;
      return;
    }
    el.innerHTML = PESOS.map(p => {
      const g = rows.filter(t => t.peso === p.v);
      if (!g.length) return "";
      const done = g.filter(t => t.status === "feito").length;
      return `<section class="group" aria-label="${p.plural}">
        <div class="group-head"><span class="wdot w${p.v}"></span><h3>${p.plural}</h3><span class="meta">${pts(p.v)} cada · ${done}/${g.length} feitas</span></div>
        <ul class="items">${g.map(fxItemHTML).join("")}</ul></section>`;
    }).join("");
  }

  function fxRenderBar() {
    const list = fxWeek(), P = state.faxina.pessoas;
    if (!list) {
      $bar.innerHTML = `<div class="sum"><b>${weekLabel(state.week)}</b><small>Semana sem lista</small></div>
        <button type="button" class="btn btn-primary" data-act="fx-add">${icon("plus")}Adicionar</button>`;
      return;
    }
    const s = fxScore(list), prog = s.total ? (s.feitas / s.total) * 100 : 0;
    $bar.innerHTML = `
      <div class="sum">
        <div class="top"><span class="fx-mini">${P.map(p => `${avatarHTML(p, " xs")}<b>${s.per[p].feito}</b><small>/${s.per[p].atrib}</small>`).join("")}</span><small>${s.feitas}/${s.total} feitas</small></div>
        <div class="progress" aria-hidden="true"><i style="width:${prog}%"></i></div>
      </div>
      <button type="button" class="btn btn-primary" data-act="fx-add">${icon("plus")}Adicionar</button>`;
  }
  $bar.addEventListener("click", e => { if (e.target.closest('[data-act="fx-add"]')) fxOpenSheet(null); });

  function fxCreateWeek(w, divide) {
    const list = state.faxina.tarefasFixas.map(f => ({ id: newId(), fixaId: f.id, nome: f.nome, peso: f.peso, responsavel: f.juntos ? JUNTOS : "", status: "pendente" }));
    state.faxina.semanas[w] = list;
    if (divide) fxDivide(list, true);
    save();
    monthAnim = "fade-in";
    render();
    if (divide && list.length) {
      const s = fxScore(list);
      toast(`Lista criada e dividida: ${state.faxina.pessoas.map(p => `${p} ${pts(s.per[p].atrib)}`).join(" · ")}`);
    } else toast("Lista da semana criada.");
  }

  function fxToggle(input) {
    const li = input.closest(".item");
    const list = fxWeek();
    const t = list && list.find(x => x.id === li.dataset.id);
    if (!t) return;
    t.status = input.checked ? "feito" : "pendente";
    save();
    if (navigator.vibrate && input.checked) { try { navigator.vibrate(12); } catch (err) { /* ignora */ } }
    const hadFocus = document.activeElement === input;
    fxRenderSummary(); fxRenderBar(); fxRenderList();
    const fresh = document.querySelector(`.item[data-id="${t.id}"]`);
    if (fresh) {
      const chk = fresh.querySelector(".check");
      chk.classList.add("pulse");
      if (hadFocus) fresh.querySelector('[data-act="fx-toggle"]').focus();
    }
  }

  $view.addEventListener("click", e => {
    if (state.module !== "faxina") return;
    const fb = e.target.closest("[data-fxfilter]");
    if (fb) { state.fxFilter = fb.dataset.fxfilter; savePrefs(); fxRenderList(); return; }
    const a = e.target.closest("[data-act]");
    const act = a && a.dataset.act;
    if (!act || !act.startsWith("fx-") || act === "fx-toggle") return;
    if (act === "fx-prev") fxGo("week", addDays(state.week, -7));
    else if (act === "fx-next") fxGo("week", addDays(state.week, 7));
    else if (act === "fx-today") fxGo("week", thisWeek());
    else if (act === "fx-create") fxCreateWeek(state.week, a.dataset.divide === "1");
    else if (act === "fx-edit") fxOpenSheet(a.closest(".item").dataset.id);
    else if (act === "fx-add") fxOpenSheet(null);
    else if (act === "fx-divide") fxOpenDivide();
    else if (act === "fx-all") { state.fxFilter = "all"; savePrefs(); fxRenderList(); }
    else if (act === "fx-goto") fxGo("week", a.dataset.w);
  });
  $view.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.act === "fx-toggle") fxToggle(e.target); });
  $view.addEventListener("keydown", e => {
    const tr = e.target.closest && e.target.closest('tr[data-act="fx-goto"]');
    if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fxGo("week", tr.dataset.w); }
  });

  /* ----- adicionar / editar tarefa ----- */
  let fxEd = null;
  function fxOpenSheet(id) {
    if (state.module !== "faxina") return;
    if (state.fxView !== "week") fxGo("week");
    if (!fxWeek()) { state.faxina.semanas[state.week] = []; save(); render(); }
    const list = fxWeek();
    const t = id ? list.find(x => x.id === id) : null;
    if (id && !t) return;
    fxEd = { id: id, confirm: false };
    const P = state.faxina.pessoas;
    const d = t || { nome: "", peso: ui.fxPeso || 2, responsavel: "", status: "pendente", fixaId: null };
    const fixa = t ? !!t.fixaId : true;
    const respOpts = P.map((p, i) => [p, p, "p" + (i + 1)]).concat([[JUNTOS, "Juntos", "pj"], ["", "Ninguém", "pn"]]);
    openSheet("fx", `
      <form id="fxForm" novalidate>
        <div class="sheet-head">
          <h2 id="sheetTitle">${t ? "Editar tarefa" : "Nova tarefa"} <span class="label">· ${weekLabel(state.week)}</span></h2>
          <button type="button" class="icon-btn" data-close aria-label="Fechar">${icon("x")}</button>
        </div>
        <div class="sheet-body">
          <div class="field" id="fw-fxnome">
            <label for="fx-nome">Tarefa</label>
            <input class="input big" id="fx-nome" autocomplete="off" placeholder="Ex.: Limpar geladeira" value="${esc(d.nome)}" aria-describedby="e-fxnome">
            <p class="err" id="e-fxnome">${icon("alert", "sm")}<span></span></p>
          </div>
          <fieldset class="field">
            <legend class="flabel">Peso</legend>
            <div class="chips c3">${PESOS.map(p => `<label class="chip-opt w${p.v}"><input type="radio" name="peso" value="${p.v}" ${p.v === d.peso ? "checked" : ""}><span><span class="wdot w${p.v}"></span><span>${p.label}<small>${pts(p.v)}</small></span></span></label>`).join("")}</div>
          </fieldset>
          <fieldset class="field">
            <legend class="flabel">Quem faz</legend>
            <div class="chips">${respOpts.map(([v, l, cls]) => `<label class="chip-opt ${cls}"><input type="radio" name="resp" value="${esc(v)}" ${v === d.responsavel ? "checked" : ""}><span>${avatarHTML(v, " xs")}${esc(l)}</span></label>`).join("")}</div>
          </fieldset>
          <fieldset class="field">
            <legend class="flabel">Situação</legend>
            <div class="chips c3">${["pendente", "feito", "naofez"].map(st => `<label class="chip-opt st-${st}"><input type="radio" name="status" value="${st}" ${st === d.status ? "checked" : ""}><span>${icon(st === "feito" ? "check" : st === "naofez" ? "x" : "clock", "sm")}${STATUS_LABEL[st]}</span></label>`).join("")}</div>
          </fieldset>
          <label class="switch-row toggle" for="fx-fixa">
            <span><span class="t">Repetir toda semana</span><span class="s" style="display:block">Entra sozinha nas próximas semanas criadas</span></span>
            <input type="checkbox" id="fx-fixa" ${fixa ? "checked" : ""}><span class="sw"></span>
          </label>
        </div>
        <div class="sheet-foot" id="fxFoot"></div>
      </form>`);
    fxRenderFoot();
    const f = document.getElementById("fxForm");
    f.addEventListener("input", e => clearFieldError(e.target));
    f.addEventListener("submit", e => { e.preventDefault(); fxSubmit(e.submitter && e.submitter.dataset.more === "1"); });
    f.addEventListener("click", e => { const a = e.target.closest("[data-fxact]"); if (a) fxFootAction(a.dataset.fxact); });
    const nome = document.getElementById("fx-nome");
    nome.addEventListener("focus", () => { if (isNarrow()) setTimeout(() => nome.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }), 280); });
    setTimeout(() => {
      if (!t) nome.focus();
      else { const h = document.getElementById("sheetTitle"); h.setAttribute("tabindex", "-1"); h.focus(); }
    }, 60);
  }

  function fxRenderFoot() {
    const foot = document.getElementById("fxFoot");
    if (!foot) return;
    const list = fxWeek();
    const t = fxEd.id && list ? list.find(x => x.id === fxEd.id) : null;
    if (fxEd.confirm && t) {
      foot.innerHTML = t.fixaId
        ? `<p class="confirm-text">Excluir “${esc(t.nome || "tarefa sem nome")}”? Ela se repete toda semana.</p>
           <button type="button" class="btn" data-fxact="cancel-del">Cancelar</button>
           <button type="button" class="btn" data-fxact="del-week">Só desta semana</button>
           <button type="button" class="btn btn-danger" data-fxact="del-all">${icon("trash")}Desta e das próximas</button>`
        : `<p class="confirm-text">Excluir “${esc(t.nome || "tarefa sem nome")}” desta semana?</p>
           <button type="button" class="btn" data-fxact="cancel-del">Cancelar</button>
           <button type="button" class="btn btn-danger" data-fxact="del-week">${icon("trash")}Excluir</button>`;
      foot.querySelector('[data-fxact="cancel-del"]').focus();
      return;
    }
    foot.innerHTML = t
      ? `<button type="button" class="btn btn-danger-quiet" data-fxact="ask-del">${icon("trash")}Excluir tarefa</button><span class="grow"></span>
         <button type="button" class="btn" data-close>Cancelar</button>
         <button type="submit" class="btn btn-primary">Salvar</button>`
      : `<button type="submit" class="btn" data-more="1">Salvar e adicionar outra</button><span class="grow"></span>
         <button type="submit" class="btn btn-primary">${icon("plus")}Adicionar</button>`;
  }

  function fxFootAction(a) {
    if (a === "ask-del") { fxEd.confirm = true; fxRenderFoot(); }
    else if (a === "cancel-del") { fxEd.confirm = false; fxRenderFoot(); }
    else if (a === "del-week" || a === "del-all") fxDelete(fxEd.id, a === "del-all");
  }

  function fxSyncFixa(t, fixa) {
    const F = state.faxina.tarefasFixas;
    const cur = t.fixaId ? F.find(f => f.id === t.fixaId) : null;
    if (fixa) {
      if (cur) Object.assign(cur, { nome: t.nome, peso: t.peso, juntos: t.responsavel === JUNTOS });
      else { const f = { id: newId(), nome: t.nome, peso: t.peso, juntos: t.responsavel === JUNTOS }; F.push(f); t.fixaId = f.id; }
    } else if (t.fixaId) {
      state.faxina.tarefasFixas = F.filter(f => f.id !== t.fixaId);
      t.fixaId = null;
    }
  }

  function fxSubmit(another) {
    const nomeEl = document.getElementById("fx-nome");
    const nome = nomeEl.value.trim();
    if (!nome) { setFieldError("fxnome", "Informe o nome da tarefa."); nomeEl.focus(); return; }
    const val = n => { const el = document.querySelector(`#fxForm input[name="${n}"]:checked`); return el ? el.value : null; };
    const peso = Number(val("peso")) || 2;
    const responsavel = val("resp") || "";
    const status = val("status") || "pendente";
    const fixa = document.getElementById("fx-fixa").checked;
    ui.fxPeso = peso;
    const list = fxWeek();
    const editingId = fxEd.id;
    let t;
    if (editingId) {
      t = list.find(x => x.id === editingId);
      if (!t) { closeSheet(); return; }
      Object.assign(t, { nome: nome, peso: peso, responsavel: responsavel, status: status });
    } else {
      t = { id: newId(), fixaId: null, nome: nome, peso: peso, responsavel: responsavel, status: status };
      list.push(t);
    }
    fxSyncFixa(t, fixa);
    save();
    if (!editingId && another) {
      toast(`“${nome}” adicionada.`);
      fxRefresh();
      nomeEl.value = "";
      const set = (n, v) => { const r = document.querySelector(`#fxForm input[name="${n}"][value="${v}"]`); if (r) r.checked = true; };
      set("resp", ""); set("status", "pendente");
      nomeEl.focus();
      return;
    }
    closeSheet();
    if (state.fxFilter !== "all" && !(state.fxFilter === t.responsavel || (state.fxFilter === "none" && !t.responsavel))) state.fxFilter = "all";
    fxRefresh();
    flashItem(t.id, !editingId);
    toast(editingId ? "Tarefa salva." : `“${nome}” adicionada.`);
  }

  function fxDelete(id, alsoFixa) {
    const w = state.week, list = fxWeek();
    const idx = list ? list.findIndex(x => x.id === id) : -1;
    if (idx < 0) { closeSheet(); return; }
    const [rem] = list.splice(idx, 1);
    let remFixa = null, fIdx = -1;
    if (alsoFixa && rem.fixaId) {
      fIdx = state.faxina.tarefasFixas.findIndex(f => f.id === rem.fixaId);
      if (fIdx >= 0) remFixa = state.faxina.tarefasFixas.splice(fIdx, 1)[0];
    }
    save();
    closeSheet();
    fxRefresh();
    toast(`“${rem.nome || "Tarefa"}” excluída${remFixa ? " desta e das próximas semanas" : ""}.`, {
      action: "Desfazer",
      onAction: () => {
        const L = state.faxina.semanas[w];
        if (L) L.splice(Math.min(idx, L.length), 0, rem);
        if (remFixa) state.faxina.tarefasFixas.splice(Math.min(fIdx, state.faxina.tarefasFixas.length), 0, remFixa);
        save();
        if (state.module === "faxina") { render(); flashItem(rem.id); }
        toast("Tarefa restaurada.");
      }
    });
  }

  /* ----- sugerir divisão ----- */
  function fxOpenDivide() {
    const list = fxWeek();
    if (!list) return;
    const movAll = list.filter(t => t.responsavel !== JUNTOS && t.status === "pendente");
    const movNone = movAll.filter(t => !t.responsavel);
    const sum = a => a.reduce((n, t) => n + t.peso, 0);
    const choice = (only, ic, title, sub) => `<button type="button" class="choice" data-fxdiv="${only}">
      <span class="stat-ic green">${icon(ic)}</span><span><b>${title}</b><small>${sub}</small></span></button>`;
    openSheet("fxdiv", `
      <div class="sheet-head"><h2 id="sheetTitle">Sugerir divisão</h2><button type="button" class="icon-btn" data-close aria-label="Fechar">${icon("x")}</button></div>
      <div class="sheet-body">
        <p class="hint">O app distribui as tarefas pendentes para deixar os pontos o mais parecidos possível (pesada 3, média 2, leve 1). Tarefas feitas, marcadas como “não fez” ou feitas juntos não mudam. Depois dá para trocar qualquer uma.</p>
        ${movNone.length ? choice("1", "users", "Dividir só as sem responsável", `${movNone.length} ${movNone.length === 1 ? "tarefa" : "tarefas"} · ${pts(sum(movNone))}`) : ""}
        ${movAll.length ? choice("0", "shuffle", "Refazer a divisão das pendentes", `${movAll.length} tarefas · ${pts(sum(movAll))} sorteadas de novo`) : `<p class="note ok">Não há tarefas pendentes para dividir.</p>`}
      </div>`);
    setTimeout(() => { const b = $sheet.querySelector(".choice") || $sheet.querySelector("[data-close]"); if (b) b.focus(); }, 60);
  }
  $sheet.addEventListener("click", e => {
    const b = e.target.closest("[data-fxdiv]");
    if (!b) return;
    const w = state.week, list = fxWeek(w);
    if (!list) return;
    const before = list.map(t => [t.id, t.responsavel]);
    fxDivide(list, b.dataset.fxdiv === "1");
    save();
    closeSheet();
    fxRefresh();
    const s = fxScore(list);
    toast(`Dividido: ${state.faxina.pessoas.map(p => `${p} ${pts(s.per[p].atrib)}`).join(" · ")}`, {
      action: "Desfazer",
      onAction: () => {
        const L = state.faxina.semanas[w];
        before.forEach(([id, r]) => { const t = L && L.find(x => x.id === id); if (t) t.responsavel = r; });
        save();
        if (state.module === "faxina") render();
        toast("Divisão desfeita.");
      }
    });
  });

  /* ----- histórico ----- */
  function fxRenderHist() {
    const P = state.faxina.pessoas;
    const weeks = Object.keys(state.faxina.semanas).sort().reverse();
    const tot = {};
    P.forEach(p => { tot[p] = { feito: 0, atrib: 0, naofez: 0 }; });
    const rows = weeks.map(w => {
      const s = fxScore(state.faxina.semanas[w]);
      P.forEach(p => { tot[p].feito += s.per[p].feito; tot[p].atrib += s.per[p].atrib; tot[p].naofez += s.per[p].naofez; });
      return { w: w, s: s };
    });
    const cur = thisWeek();
    $view.innerHTML = `<div class="${monthAnim || "fade-in"}">
      <div class="year-head"><div><h1>Histórico da faxina</h1><p>Pontos das tarefas feitas em cada semana. Toque em uma semana para abrir.</p></div></div>
      ${weeks.length ? `
      <div class="year-grid">
        <div class="kpis fx-kpis full">
          ${P.map(p => `<div class="card kpi"><p class="label person-head">${avatarHTML(p, " xs")}${esc(p)}</p><p class="v">${pts(tot[p].feito)}</p><p class="s">de ${pts(tot[p].atrib)} atribuídos${tot[p].naofez ? ` · ${tot[p].naofez} não fez` : ""}</p></div>`).join("")}
          <div class="card kpi"><p class="label">Semanas registradas</p><p class="v">${weeks.length}</p><p class="s">${state.faxina.tarefasFixas.length} tarefas fixas por semana</p></div>
        </div>
        <section class="card panel full">
          <h2>Semanas</h2>
          <div class="tbl-wrap"><table class="clickable fx-hist">
            <thead><tr><th>Semana</th>${P.map(p => `<th class="n">${esc(p)}</th>`).join("")}<th class="n wide2">Juntos</th><th class="n">Feitas</th></tr></thead>
            <tbody>${rows.map(({ w, s }) => `<tr data-act="fx-goto" data-w="${w}" tabindex="0">
              <td><b>${weekLabel(w)}</b>${w === cur ? '<span class="label"> · atual</span>' : ""}</td>
              ${P.map(p => `<td class="n"><b>${s.per[p].feito}</b><span class="muted">/${s.per[p].atrib}</span>${s.per[p].naofez ? ` <span class="nf" title="${s.per[p].naofez} não fez">✕${s.per[p].naofez}</span>` : ""}</td>`).join("")}
              <td class="n wide2">${s.juntos.done}/${s.juntos.n}</td>
              <td class="n">${s.feitas}/${s.total}</td></tr>`).join("")}</tbody>
          </table></div>
          <p class="hint">Pontos feitos / pontos atribuídos. ✕ = tarefas que a pessoa não fez.</p>
        </section>
      </div>` : `<div class="empty"><span class="ic">${icon("calendar")}</span><h3>Nenhuma semana registrada</h3><p>Crie a lista da semana para começar o placar.</p>
        <button type="button" class="btn btn-primary" data-act="fx-goto" data-w="${cur}">Abrir esta semana</button></div>`}
    </div>`;
    monthAnim = "";
  }

  /* ---------------- Início ---------------- */
  const ui = { q: "", lastCat: null, fxPeso: 2 };

  async function init() {
    const prefs = loadPrefs();
    let months = null, migrated = false, faxina = null;
    const srv = await askServer();
    if (srv) {
      DB.mode = "server";
      if (srv.data) {
        try { months = fromDB(srv.data); faxina = fromFaxina(srv.data); DB.updatedAt = srv.data.atualizadoEm || null; }
        catch (e) { DB.readonly = true; DB.status = "err"; DB.msg = "db.json inválido: " + e.message; }
      }
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (raw) { const d = JSON.parse(raw); months = fromDB(d); faxina = fromFaxina(d); DB.updatedAt = d.atualizadoEm || null; }
      } catch (e) { /* começa com os dados da planilha */ }
      if (!months) {
        try { const old = JSON.parse(localStorage.getItem(STORE_KEY)); if (old && old.months) { months = old.months; migrated = true; } } catch (e) { /* ignora */ }
      }
    }
    const fresh = !months;
    const nowIdx = new Date().getFullYear() === 2026 ? new Date().getMonth() : 0;
    // preferências da versão anterior: view era "dash" ou o nome do mês
    const legacyMonth = MESES.includes(prefs.view) ? prefs.view : null;
    state = {
      months: months || seed().months,
      view: prefs.view === "year" || prefs.view === "dash" ? "year" : "month",
      month: MESES.includes(prefs.month) ? prefs.month : legacyMonth || MESES[nowIdx],
      topMonth: MESES.includes(prefs.topMonth) ? prefs.topMonth : MESES[nowIdx],
      filter: ["all", "pend", "ok"].includes(prefs.filter) ? prefs.filter : "all",
      sort: ["list", "pending", "name", "value"].includes(prefs.sort) ? prefs.sort : "list",
      group: prefs.group !== false,
      faxina: faxina || seedFaxina(),
      module: prefs.module === "faxina" ? "faxina" : "compras",
      week: typeof prefs.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(prefs.week) ? isoDate(mondayOf(parseIso(prefs.week))) : thisWeek(),
      fxView: prefs.fxView === "hist" ? "hist" : "week",
      fxFilter: typeof prefs.fxFilter === "string" ? prefs.fxFilter : "all"
    };
    const fxFresh = !faxina;
    if (prefs.view === "dash") state.view = "month"; // a tela principal agora é o mês
    DB.lastSaved = fresh || migrated || fxFresh ? "" : snapshot();
    renderStatus();
    render();
    if ((fresh || migrated || fxFresh) && !DB.readonly) flush();
  }

  init();
})();
