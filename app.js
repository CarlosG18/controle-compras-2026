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
    return { app: "controle-compras", versao: 1, ano: 2026, atualizadoEm: new Date().toISOString(), meses: meses };
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
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ view: state.view, topMonth: state.topMonth, filter: state.filter })); } catch (e) { /* ignora */ }
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

  function save() { savePrefs(); clearTimeout(DB.timer); DB.timer = setTimeout(flush, 400); }
  function flush() { clearTimeout(DB.timer); DB.chain = DB.chain.then(writeDB); return DB.chain; }

  async function writeDB() {
    if (DB.readonly) return;
    const snap = JSON.stringify(state.months);
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
    if (JSON.stringify(state.months) !== DB.lastSaved) return; // há alterações locais ainda não salvas
    const srv = await askServer();
    if (!srv || !srv.data || srv.data.atualizadoEm === DB.updatedAt) return;
    try {
      state.months = fromDB(srv.data);
      DB.updatedAt = srv.data.atualizadoEm;
      DB.lastSaved = JSON.stringify(state.months);
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

  /* ---------------- Elementos ---------------- */
  const $tabs = document.getElementById("tabs");
  const $view = document.getElementById("view");
  const $status = document.getElementById("dbStatus");
  const $panel = document.getElementById("dataPanel");
  const $toggle = document.getElementById("dataToggle");

  /* ---------------- Abas ---------------- */
  function renderTabs() {
    const items = [{ key: "dash", label: "Dashboard" }].concat(MESES.map(m => ({ key: m, label: m })));
    $tabs.innerHTML = items.map(t => {
      const cur = state.view === t.key ? ' aria-current="page"' : "";
      let dot = "";
      if (t.key !== "dash" && summary(t.key).bought > 0) dot = '<span class="dot" title="Tem itens comprados"></span>';
      return `<button type="button" class="tab${t.key === "dash" ? " dash" : ""}" data-view="${esc(t.key)}"${cur}>${esc(t.label)}${dot}</button>`;
    }).join("");
    const active = $tabs.querySelector('[aria-current="page"]');
    if (active && $tabs.scrollWidth > $tabs.clientWidth) {
      $tabs.scrollLeft = active.offsetLeft - $tabs.clientWidth / 2 + active.offsetWidth / 2;
    }
  }
  $tabs.addEventListener("click", e => {
    const b = e.target.closest("[data-view]");
    if (!b) return;
    go(b.dataset.view);
  });

  function go(view) {
    state.view = view;
    save();
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    renderTabs();
    document.body.classList.toggle("has-mbar", state.view !== "dash");
    if (state.view === "dash") renderDash();
    else renderMonth(state.view);
  }

  /* ---------------- Dashboard ---------------- */
  function renderDash() {
    const sums = MESES.map(m => ({ m: m, s: summary(m) }));
    const annual = { spent: 0, bought: 0, pending: 0, cats: [0, 0, 0, 0] };
    sums.forEach(x => {
      annual.spent += x.s.spent; annual.bought += x.s.bought; annual.pending += x.s.pending;
      x.s.cats.forEach((v, i) => { annual.cats[i] += v; });
    });
    const active = sums.filter(x => x.s.spent > 0);
    const maxM = active.reduce((a, x) => (!a || x.s.spent > a.s.spent ? x : a), null);
    const minM = active.reduce((a, x) => (!a || x.s.spent < a.s.spent ? x : a), null);
    const avg = active.length ? annual.spent / active.length : 0;
    const maxSpent = maxM ? maxM.s.spent : 0;

    const kpis = `
      <div class="kpis full">
        <div class="kpi main"><p class="eyebrow">Total anual</p><div class="val">${money(annual.spent)}</div><div class="sub">${annual.bought} itens comprados</div></div>
        <div class="kpi"><p class="eyebrow">Maior mês</p><div class="val">${money(maxM ? maxM.s.spent : 0)}</div><div class="sub">${maxM ? maxM.m : "sem compras"}</div></div>
        <div class="kpi"><p class="eyebrow">Menor mês</p><div class="val">${money(minM ? minM.s.spent : 0)}</div><div class="sub">${minM ? minM.m : "sem compras"}</div></div>
        <div class="kpi"><p class="eyebrow">Média mensal</p><div class="val">${money(avg)}</div><div class="sub">${active.length} ${active.length === 1 ? "mês" : "meses"} com gasto</div></div>
      </div>`;

    const bars = sums.map(x => {
      const w = maxSpent ? (x.s.spent / maxSpent) * 100 : 0;
      const segs = x.s.cats.map((v, i) => (v > 0 && x.s.spent > 0 ? `<i class="${CATKEY[i]}" style="width:${(v / x.s.spent) * w}%"></i>` : "")).join("");
      return `<button type="button" class="bar-row${x.s.spent > 0 ? "" : " zero"}" data-view="${x.m}" aria-label="${x.m}: ${money(x.s.spent)}">
        <span class="m">${x.m.slice(0, 3)}</span>
        <span class="bar-track">${segs}</span>
        <span class="v mono">${money(x.s.spent)}</span></button>`;
    }).join("");
    const legend = `<div class="legend">${CATS.map((c, i) => `<span><span class="sw ${CATKEY[i]}"></span>${c}</span>`).join("")}</div>`;

    // Top 5
    const tm = state.topMonth && MESES.includes(state.topMonth) ? state.topMonth : "Setembro";
    const top = state.months[tm]
      .map(r => ({ r: r, t: rowTotal(r) }))
      .filter(x => isNum(x.t) && norm(x.r.item))
      .sort((a, b) => b.t - a.t)
      .slice(0, 5);
    const medals = ["1º", "2º", "3º", "4º", "5º"];
    const topRows = top.length ? top.map((x, i) => {
      const ci = catIdx(x.r.cat);
      const chip = ci >= 0 ? `<span class="chip ${CATKEY[ci]}">${CATS[ci]}</span>` : "";
      return `<tr><td class="rank">${medals[i]}</td>
        <td class="c-item">${esc(x.r.item)}<small class="mob-only">${chip}</small></td>
        <td class="n mono">${money(x.t)}</td><td class="c-cat">${chip}</td></tr>`;
    }).join("") : `<tr><td colspan="4" class="empty">Nenhum item com preço em ${tm}.</td></tr>`;

    // Categorias
    const catRows = CATS.map((c, i) => {
      const share = annual.spent > 0 ? annual.cats[i] / annual.spent : null;
      const mavg = active.length ? annual.cats[i] / active.length : null;
      return `<tr><td><span class="chip ${CATKEY[i]}">${c}</span>
          <div class="share"><i class="${CATKEY[i]}" style="width:${share ? share * 100 : 0}%"></i></div></td>
        <td class="n mono">${money(annual.cats[i])}</td><td class="n mono">${pct(share)}</td><td class="n mono c-avg">${money(mavg)}</td></tr>`;
    }).join("");

    // Resumo mensal
    const resumoRows = sums.map(x => {
      const mix = x.s.cats.map((v, i) => (v > 0 ? `<i class="${CATKEY[i]}" style="width:${(v / x.s.spent) * 100}%"></i>` : "")).join("");
      return `<tr data-view="${x.m}">
        <td class="c-mes">${x.m}</td>
        <td class="n mono c-tot">${money(x.s.spent)}</td>
        <td class="n mono c-cnt-a">${x.s.bought}</td>
        <td class="n mono c-cnt-b">${x.s.pending}</td>
        <td class="c-cnt">${x.s.bought} comprados · ${x.s.pending} pendentes</td>
        ${x.s.cats.map(v => `<td class="n mono c-cat4">${money(v)}</td>`).join("")}
        <td class="c-mix"><div class="mix">${mix}</div></td>
      </tr>`;
    }).join("");

    $view.innerHTML = `
      <div class="dash-grid">
        ${kpis}
        <section class="card">
          <h3>Evolução de gastos mensais <small>só itens comprados</small></h3>
          <div class="bars">${bars}</div>
          ${legend}
        </section>
        <div class="stack">
          <section class="card">
            <h3>Top 5 itens mais caros</h3>
            <div class="top5-head">
              <label for="topMonth">Mês</label>
              <select id="topMonth" class="sel">${MESES.map(m => `<option${m === tm ? " selected" : ""}>${m}</option>`).join("")}</select>
            </div>
            <div class="table-wrap"><table class="top5">
              <thead><tr><th>Pos.</th><th>Item</th><th class="n">Preço total</th><th class="c-cat">Categoria</th></tr></thead>
              <tbody>${topRows}</tbody></table></div>
          </section>
          <section class="card">
            <h3>Gasto anual por categoria</h3>
            <div class="table-wrap"><table class="cats">
              <thead><tr><th>Categoria</th><th class="n">Total</th><th class="n">% do total</th><th class="n c-avg">Média mensal</th></tr></thead>
              <tbody>${catRows}</tbody>
              <tfoot><tr><td>Total</td><td class="n mono">${money(annual.spent)}</td><td class="n mono">${annual.spent > 0 ? "100%" : "—"}</td><td class="c-avg"></td></tr></tfoot>
            </table></div>
          </section>
        </div>
        <section class="card full">
          <h3>Resumo mensal <small>toque em um mês para abrir a lista</small></h3>
          <div class="table-wrap"><table class="resumo clickable">
            <thead><tr><th>Mês</th><th class="n">Total gasto</th><th class="n">Comprados</th><th class="n">Pendentes</th>
              ${CATS.map(c => `<th class="n c-cat4">${c}</th>`).join("")}</tr></thead>
            <tbody>${resumoRows}</tbody>
            <tfoot><tr>
              <td class="c-mes">Total anual</td><td class="n mono c-tot">${money(annual.spent)}</td>
              <td class="n mono c-cnt-a">${annual.bought}</td><td class="n mono c-cnt-b">${annual.pending}</td>
              <td class="c-cnt">${annual.bought} comprados · ${annual.pending} pendentes</td>
              ${annual.cats.map(v => `<td class="n mono c-cat4">${money(v)}</td>`).join("")}
              <td class="c-mix"></td>
            </tr></tfoot>
          </table></div>
        </section>
      </div>`;

    $view.querySelector("#topMonth").addEventListener("change", e => {
      state.topMonth = e.target.value; save(); renderDash();
    });
    $view.querySelectorAll(".bar-row, .resumo tbody tr").forEach(el => {
      el.addEventListener("click", () => go(el.dataset.view));
    });
  }

  /* ---------------- Mês ---------------- */
  function catOptions(sel) {
    const ci = catIdx(sel);
    return CATS.map((c, i) => `<option value="${c}"${i === ci ? " selected" : ""}>${c}</option>`).join("");
  }

  function rowHTML(r, mIdx) {
    const prev = prevPrice(mIdx, r.item);
    const tot = rowTotal(r);
    const eco = economy(prev, r.unit);
    const ci = catIdx(r.cat);
    const hide = (state.filter === "pend" && r.bought) || (state.filter === "ok" && !r.bought) ? " hidden" : "";
    return `<tr data-id="${r.id}" class="${r.bought ? "is-ok" : "is-pend"}"${hide}>
      <td class="c-chk"><label class="chk"><input type="checkbox" data-f="bought" id="b-${r.id}"${r.bought ? " checked" : ""} aria-label="Comprado"><span></span></label></td>
      <td class="c-cat"><select data-f="cat" id="c-${r.id}" aria-label="Categoria" data-cat="${ci >= 0 ? CATKEY[ci] : ""}">${catOptions(r.cat)}</select></td>
      <td class="c-item"><input data-f="item" id="i-${r.id}" value="${esc(r.item)}" placeholder="Nome do item" aria-label="Item" autocomplete="off"></td>
      <td class="c-qty" data-label="Qtd."><input data-f="qty" id="q-${r.id}" class="num" inputmode="decimal" value="${numIn(r.qty)}" aria-label="Quantidade"></td>
      <td class="c-prev" data-label="Mês passado"><span class="out" data-o="prev">${isNum(prev) ? money(prev) : '<span class="dim">—</span>'}</span></td>
      <td class="c-unit" data-label="Preço unit."><input data-f="unit" id="u-${r.id}" class="num" inputmode="decimal" placeholder="0,00" value="${numIn(r.unit)}" aria-label="Preço unitário"></td>
      <td class="c-tot" data-label="Total"><span class="out" data-o="tot">${isNum(tot) ? money(tot) : '<span class="dim">—</span>'}</span></td>
      <td class="c-eco" data-label="Economia"><span class="out ${ecoClass(eco)}" data-o="eco">${isNum(eco) ? signed(eco) : '<span class="dim">—</span>'}</span></td>
      <td class="c-brand" data-label="Marca"><input data-f="brand" id="m-${r.id}" value="${esc(r.brand)}" aria-label="Marca"></td>
      <td class="c-obs" data-label="Observações"><input data-f="obs" id="o-${r.id}" value="${esc(r.obs)}" aria-label="Observações"></td>
      <td class="c-del"><button type="button" class="del" data-act="del" aria-label="Remover ${esc(r.item || "item")}">×</button></td>
    </tr>`;
  }
  function ecoClass(eco) {
    if (!isNum(eco)) return "";
    const r = round2(eco);
    return r > 0 ? "eco-pos" : r < 0 ? "eco-neg" : "";
  }

  function renderMonth(m) {
    const mIdx = MESES.indexOf(m);
    const rows = state.months[m];
    const f = state.filter || "all";
    const segBtn = (k, label) => `<button type="button" data-filter="${k}" aria-pressed="${f === k}">${label}</button>`;
    $view.innerHTML = `
      <section class="month-head">
        <div>
          <p class="eyebrow">Mês ${mIdx + 1} de 12${mIdx > 0 ? ` · preços comparados com ${MESES[mIdx - 1]}` : ""}</p>
          <h2>${m} 2026</h2>
        </div>
        <div class="mstats" id="mstats"></div>
      </section>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Filtrar itens">${segBtn("all", "Todos")}${segBtn("pend", "Pendentes")}${segBtn("ok", "Comprados")}</div>
        <div class="tools">
          <button type="button" class="btn" id="addBtn">+ Adicionar item</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="items">
          <thead><tr>
            <th aria-label="Comprado">✓</th><th>Categoria</th><th>Item</th><th class="n">Qtd.</th>
            <th class="n">Mês passado</th><th class="n">Preço unit.</th><th class="n">Preço total</th>
            <th class="n">Economia</th><th>Marca</th><th>Observações</th><th aria-label="Remover"></th>
          </tr></thead>
          <tbody id="tbody">${rows.map(r => rowHTML(r, mIdx)).join("")}</tbody>
          <tfoot><tr>
            <td colspan="6" id="tfCount"></td>
            <td class="n mono" id="tfSpent"></td>
            <td colspan="4" class="muted" id="tfPlanned"></td>
          </tr></tfoot>
        </table>
      </div>
      <p class="empty" id="emptyMsg" hidden></p>
      <section class="catsub" id="catsub" aria-label="Gasto por categoria"></section>
      <div class="mbar" id="mbar" aria-live="polite"></div>`;

    refreshTotals(m);

    const tbody = document.getElementById("tbody");
    tbody.addEventListener("input", e => onField(e, m, mIdx));
    tbody.addEventListener("change", e => onField(e, m, mIdx));
    tbody.addEventListener("click", e => {
      const del = e.target.closest('[data-act="del"]');
      if (!del) return;
      const tr = del.closest("tr");
      state.months[m] = state.months[m].filter(r => r.id !== tr.dataset.id);
      tr.remove();
      save(); refreshTotals(m); renderTabs();
    });
    // ao sair de um campo numérico, mostra o valor normalizado
    tbody.addEventListener("focusout", e => {
      const f = e.target.dataset && e.target.dataset.f;
      if (f !== "qty" && f !== "unit") return;
      const r = findRow(m, e.target.closest("tr").dataset.id);
      if (r) e.target.value = numIn(r[f]);
    });

    document.getElementById("addBtn").addEventListener("click", () => {
      const r = mkRow(0, "", 1, 0, null);
      state.months[m].push(r);
      if (state.filter === "ok") state.filter = "all";
      save();
      renderMonth(m);
      const inp = document.getElementById("i-" + r.id);
      if (inp) { inp.scrollIntoView({ block: "center" }); inp.focus(); }
    });
    $view.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => {
      state.filter = b.dataset.filter; save(); renderMonth(m);
    }));
  }

  function findRow(m, id) { return state.months[m].find(r => r.id === id); }

  function onField(e, m, mIdx) {
    const el = e.target;
    const f = el.dataset && el.dataset.f;
    if (!f) return;
    if (f === "bought" && e.type !== "change") return;
    if (f === "cat" && e.type !== "change") return;
    const tr = el.closest("tr");
    const r = findRow(m, tr.dataset.id);
    if (!r) return;

    if (f === "bought") r.bought = el.checked;
    else if (f === "qty" || f === "unit") r[f] = parseNum(el.value);
    else r[f] = el.value;

    if (f === "bought") {
      tr.className = r.bought ? "is-ok" : "is-pend";
      if ((state.filter === "pend" && r.bought) || (state.filter === "ok" && !r.bought)) {
        setTimeout(() => { tr.hidden = true; refreshTotals(m); }, 350);
      }
      renderTabs();
    }
    if (f === "cat") {
      const ci = catIdx(r.cat);
      el.dataset.cat = ci >= 0 ? CATKEY[ci] : "";
    }
    if (f === "item" || f === "qty" || f === "unit") updateRowOutputs(tr, r, mIdx);
    save();
    refreshTotals(m);
  }

  function updateRowOutputs(tr, r, mIdx) {
    const prev = prevPrice(mIdx, r.item);
    const tot = rowTotal(r);
    const eco = economy(prev, r.unit);
    tr.querySelector('[data-o="prev"]').innerHTML = isNum(prev) ? money(prev) : '<span class="dim">—</span>';
    tr.querySelector('[data-o="tot"]').innerHTML = isNum(tot) ? money(tot) : '<span class="dim">—</span>';
    const ecoEl = tr.querySelector('[data-o="eco"]');
    ecoEl.className = "out " + ecoClass(eco);
    ecoEl.innerHTML = isNum(eco) ? signed(eco) : '<span class="dim">—</span>';
  }

  function refreshTotals(m) {
    const s = summary(m);
    const total = s.bought + s.pending;
    const prog = total ? (s.bought / total) * 100 : 0;
    const count = `${s.bought} comprados · ${s.pending} pendentes`;

    const mstats = document.getElementById("mstats");
    if (mstats) mstats.innerHTML = `
      <div class="mstat main"><p class="eyebrow">Total geral do mês</p><div class="val">${money(s.spent)}</div></div>
      <div class="mstat"><p class="eyebrow">Previsto (lista toda)</p><div class="val">${money(s.planned)}</div></div>
      <div class="mstat" style="min-width:12rem"><p class="eyebrow">${count}</p><div class="progress" style="margin-top:9px"><i style="width:${prog}%"></i></div></div>`;

    const tfc = document.getElementById("tfCount");
    if (tfc) {
      tfc.textContent = "Total geral do mês · " + count;
      document.getElementById("tfSpent").textContent = money(s.spent);
      document.getElementById("tfPlanned").textContent = "Previsto (lista toda): " + money(s.planned);
    }

    const catsub = document.getElementById("catsub");
    if (catsub) catsub.innerHTML = CATS.map((c, i) =>
      `<div class="kpi"><p class="eyebrow"><span class="sw ${CATKEY[i]}"></span> ${c}</p><div class="val">${money(s.cats[i])}</div><div class="sub">comprado no mês</div></div>`
    ).join("");

    const mbar = document.getElementById("mbar");
    if (mbar) mbar.innerHTML = `
      <div class="row">
        <div><small>Total comprado</small><div class="big">${money(s.spent)}</div></div>
        <div class="r"><small>Previsto</small><div class="mono">${money(s.planned)}</div></div>
      </div>
      <div class="row"><small>${count}</small><small>${Math.round(prog)}%</small></div>
      <div class="progress"><i style="width:${prog}%"></i></div>`;

    const empty = document.getElementById("emptyMsg");
    const tbody = document.getElementById("tbody");
    if (empty && tbody) {
      const visible = Array.from(tbody.rows).some(tr => !tr.hidden);
      empty.hidden = visible;
      if (!visible) {
        empty.textContent = !state.months[m].length
          ? "Lista vazia. Toque em “Adicionar item” para começar."
          : state.filter === "pend" ? "Tudo comprado neste mês." : "Nenhum item comprado ainda neste mês.";
      }
    }
  }

  /* ---------------- Painel do banco de dados ---------------- */
  const MODE_LABEL = { server: "db.json", file: "Arquivo", local: "Navegador" };
  let panelMsg = "";
  let confirmReset = false;

  function timeLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const today = new Date().toDateString() === d.toDateString();
    return today
      ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function setStatus(status, msg) {
    DB.status = status;
    DB.msg = msg || "";
    renderStatus();
  }
  function renderStatus() {
    let text;
    if (DB.status === "busy") text = "Salvando…";
    else if (DB.status === "err") text = "Erro ao salvar";
    else text = MODE_LABEL[DB.mode] + (DB.updatedAt ? " · salvo " + timeLabel(DB.updatedAt) : "");
    $status.className = "db-pill " + DB.status;
    $status.textContent = text;
    $status.title = DB.msg || text;
    if (!$panel.hidden) renderPanel();
  }

  function renderPanel() {
    const where = {
      server: `Gravando no arquivo <b>db.json</b> da pasta do sistema, pelo servidor local. No celular, abra o mesmo endereço (na mesma rede Wi-Fi) e os dois aparelhos usam o mesmo banco. A cada gravação a versão anterior fica em <b>db.backup.json</b>.`,
      file: `Gravando direto no arquivo <b>${esc(DB.fileName)}</b> que você conectou. Ao reabrir o sistema, conecte o arquivo de novo.`,
      local: `Sem servidor: os dados ficam guardados neste navegador. Para ter o banco em arquivo, rode <code>node server.js</code> na pasta do sistema${canPickFile ? " ou conecte um db.json abaixo" : ""}. Use <b>Exportar</b> para guardar uma cópia.`
    }[DB.mode];
    const fileBtns = DB.mode !== "server" && canPickFile ? `
        <button type="button" class="btn ghost" data-act="open-file">Abrir db.json do computador</button>
        <button type="button" class="btn ghost" data-act="new-file">Salvar como novo db.json</button>` : "";
    const reset = confirmReset
      ? `<span class="confirm"><span>Apagar as alterações e voltar aos dados da planilha?</span>
           <button type="button" class="btn danger" data-act="reset-yes">Restaurar</button>
           <button type="button" class="btn ghost" data-act="reset-no">Cancelar</button></span>`
      : `<button type="button" class="btn ghost" data-act="reset">Restaurar dados da planilha</button>`;
    const total = MESES.reduce((n, m) => n + state.months[m].length, 0);
    $panel.innerHTML = `
      <h3>Banco de dados <small>${total} itens em 12 meses${DB.updatedAt ? " · última gravação " + timeLabel(DB.updatedAt) : ""}</small></h3>
      <p class="where">${where}</p>
      ${DB.status === "err" ? `<p class="msg err">${esc(DB.msg)}</p>` : ""}
      ${DB.readonly ? `<p class="msg err">O db.json não pôde ser lido, então o sistema não vai gravar por cima dele. Corrija o arquivo (ou importe um válido) e recarregue a página.</p>` : ""}
      ${panelMsg ? `<p class="msg ok">${esc(panelMsg)}</p>` : ""}
      <div class="data-actions">
        <button type="button" class="btn" data-act="export">Exportar db.json</button>
        <label class="btn ghost file-btn">Importar db.json<input type="file" id="importFile" accept=".json,application/json"></label>
        ${fileBtns}
        ${reset}
      </div>`;
  }

  async function adoptData(data, origem) {
    const months = fromDB(data); // valida antes de trocar
    state.months = months;
    DB.readonly = false;
    DB.lastSaved = "";
    panelMsg = `${origem}: ${MESES.reduce((n, m) => n + months[m].length, 0)} itens carregados.`;
    render();
    await flush();
  }

  function exportDB() {
    const blob = new Blob([JSON.stringify(toDB(state.months), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "db.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    panelMsg = "db.json exportado para a pasta de downloads.";
    renderPanel();
  }

  $panel.addEventListener("change", async e => {
    if (e.target.id !== "importFile" || !e.target.files[0]) return;
    try {
      const data = JSON.parse(await e.target.files[0].text());
      await adoptData(data, "Importado");
    } catch (err) {
      panelMsg = "";
      setStatus("err", "Arquivo inválido: " + err.message);
    }
    renderPanel();
  });

  $panel.addEventListener("click", async e => {
    const act = e.target.closest("[data-act]") && e.target.closest("[data-act]").dataset.act;
    if (!act) return;
    try {
      if (act === "export") exportDB();
      else if (act === "reset") { confirmReset = true; renderPanel(); }
      else if (act === "reset-no") { confirmReset = false; renderPanel(); }
      else if (act === "reset-yes") {
        confirmReset = false;
        state.months = seed().months;
        DB.readonly = false;
        panelMsg = "Dados da planilha restaurados.";
        render();
        await flush();
      } else if (act === "open-file") {
        const [h] = await window.showOpenFilePicker({ types: [{ description: "Banco JSON", accept: { "application/json": [".json"] } }] });
        const text = await (await h.getFile()).text();
        const data = text.trim() ? JSON.parse(text) : toDB(state.months);
        DB.mode = "file"; DB.handle = h; DB.fileName = h.name;
        await adoptData(data, "Conectado a " + h.name);
      } else if (act === "new-file") {
        const h = await window.showSaveFilePicker({ suggestedName: "db.json", types: [{ description: "Banco JSON", accept: { "application/json": [".json"] } }] });
        DB.mode = "file"; DB.handle = h; DB.fileName = h.name; DB.lastSaved = "";
        panelMsg = "Banco salvo em " + h.name + ". As próximas alterações vão para esse arquivo.";
        await flush();
      }
    } catch (err) {
      if (err && err.name === "AbortError") return; // usuário cancelou a janela de arquivo
      setStatus("err", err.message);
    }
    renderStatus();
  });

  $toggle.addEventListener("click", () => {
    $panel.hidden = !$panel.hidden;
    $toggle.setAttribute("aria-expanded", String(!$panel.hidden));
    panelMsg = "";
    if (!$panel.hidden) renderPanel();
  });

  /* ---------------- Início ---------------- */
  async function init() {
    const prefs = loadPrefs();
    let months = null;
    let migrated = false;

    const srv = await askServer();
    if (srv) {
      DB.mode = "server";
      if (srv.data) {
        try { months = fromDB(srv.data); DB.updatedAt = srv.data.atualizadoEm || null; }
        catch (e) { DB.readonly = true; setStatus("err", "db.json inválido: " + e.message); }
      }
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (raw) { const d = JSON.parse(raw); months = fromDB(d); DB.updatedAt = d.atualizadoEm || null; }
      } catch (e) { /* começa do zero */ }
      if (!months) { // versão anterior do sistema guardava tudo junto
        try { const old = JSON.parse(localStorage.getItem(STORE_KEY)); if (old && old.months) { months = old.months; migrated = true; } } catch (e) { /* ignora */ }
      }
    }

    const fresh = !months;
    state = {
      months: months || seed().months,
      view: prefs.view === "dash" || MESES.includes(prefs.view) ? prefs.view : "dash",
      topMonth: MESES.includes(prefs.topMonth) ? prefs.topMonth : "Setembro",
      filter: ["all", "pend", "ok"].includes(prefs.filter) ? prefs.filter : "all"
    };
    DB.lastSaved = fresh || migrated ? "" : JSON.stringify(state.months);
    renderStatus();
    render();
    if (fresh && !DB.readonly) flush(); // cria o db.json com os dados da planilha
  }

  init();
})();
