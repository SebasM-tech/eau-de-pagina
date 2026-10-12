// API de consulta SIN base de datos: orquesta APIs externas + caché en memoria + caché de CDN.
// Variables: FRAGELLA_KEY (catálogo/notas), SERPAPI_KEY (precios Google Shopping). Sin claves -> modo demo.
import 'dotenv/config';
import express from 'express';
const app = express();
const { FRAGELLA_KEY: FRA, SERPAPI_KEY: SERP, PORT = 3001 } = process.env;

// ---------- Caché stale-while-revalidate + deduplicación de peticiones en vuelo ----------
const C = new Map(), F = new Map();
function refresh(key, fn) {
  if (!F.has(key)) F.set(key, fn().then(v => {
    if (C.size > 5000) C.delete(C.keys().next().value);
    C.set(key, { v, t: Date.now() }); return v;
  }).finally(() => F.delete(key)));
  return F.get(key);
}
async function cached(key, ttl, fn) {
  const h = C.get(key);
  if (!h) return refresh(key, fn);
  if (Date.now() - h.t > ttl) refresh(key, fn).catch(() => {}); // refresca en segundo plano
  return h.v;                                                    // el usuario nunca espera
}
const CDN = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' };
const enc = encodeURIComponent;
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ---------- Catálogo y notas ----------
const ES = { woody:'amaderado', citrus:'cítrico', aromatic:'aromático', amber:'ámbar', 'fresh spicy':'fresco especiado',
  powdery:'atalcado', 'warm spicy':'cálido especiado', green:'verde', lavender:'lavanda', sweet:'dulce', floral:'floral',
  'white floral':'floral blanco', vanilla:'vainilla', fruity:'afrutado', musky:'almizclado', leather:'cuero', rose:'rosa',
  aquatic:'acuático', fresh:'fresco', balsamic:'balsámico', smoky:'ahumado', earthy:'terroso', tropical:'tropical',
  gourmand:'gourmand', oud:'oud', iris:'iris', patchouli:'pachulí', spicy:'especiado' };
const SEED = [{ id:'bleu-de-chanel-parfum', nombre:'Bleu de Chanel Parfum', marca:'Chanel', imagen:'',
  acordes:[['amaderado',100],['cítrico',85],['aromático',72],['ámbar',68],['fresco especiado',65],['atalcado',56],
    ['cálido especiado',54],['verde',53],['lavanda',52]].map(([nombre,peso])=>({nombre,peso})),
  notas:{ salida:['Limón','Menta','Pomelo','Pimienta rosa'], corazon:['Jengibre','Nuez moscada','Jazmín','Melón'],
    fondo:['Incienso','Cedro','Sándalo','Pachulí','Ládano'] } }];

async function buscar(q) {
  if (!FRA) return SEED.filter(p => norm(p.nombre + p.marca).includes(norm(q)));
  const r = await fetch(`https://api.fragella.com/api/v1/fragrances?search=${enc(q || 'Bleu de Chanel')}&limit=12`, { headers: { 'x-api-key': FRA } });
  if (!r.ok) throw new Error('fragella ' + r.status);
  const j = await r.json();
  return (Array.isArray(j) ? j : j.data || []).map(p => ({
    id: norm(`${p.Brand}-${p.Name}`).replace(/[^a-z0-9]+/g, '-'), nombre: p.Name, marca: p.Brand, imagen: p['Image URL Transparent'] || p['Image URL'], imagenes: [p['Image URL'], ...(p['Image Fallbacks'] || [])].filter(Boolean),
    acordes: (p['Main Accords'] || []).map((a, i) => ({ nombre: ES[a.toLowerCase()] || a, peso: Math.max(40, 100 - i * 7) })),
    notas: { salida: (p.Notes?.Top || []).map(n => n.name), corazon: (p.Notes?.Middle || []).map(n => n.name), fondo: (p.Notes?.Base || []).map(n => n.name) },
  }));
}
app.get('/api/perfumes', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  try { res.set(CDN).json(await cached('s:' + norm(q), 6 * 3600e3, () => buscar(q))); }
  catch { res.status(502).json({ error: 'catálogo no disponible' }); }
});

// ---------- Divisas (base COP) ----------
const fx = async () => {
  const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
  return Object.fromEntries(Object.entries(j.rates).map(([c, v]) => [c, v / j.rates.COP])); // 1 COP = x divisa
};

// ---------- Verificación de originales ----------
const TIENDAS_OK = /sephora|falabella|notino|douglas|macy|nordstrom|el corte ingl|ripley|saks|perfumeria? (primor|ideal)/i;
const BLOQUEO = /r[eé]plica|imitaci|inspirad|similar|clon|equivalente|dupe|decant|muestra|miniatura|sin caja|tester|alternativ|gen[eé]ric|tipo /i;
const STOP = new Set(['edp', 'edt', 'eau', 'pour', 'for', 'the', 'spray']);
const verificado = (it, p) => {
  const t = norm(it.title), marca = norm(p.marca).split(/\s+/).filter(w => w.length > 2);
  const nombre = norm(p.nombre).split(/\s+/).filter(w => w.length > 2 && !STOP.has(w) && !marca.includes(w));
  return TIENDAS_OK.test(it.source || '') && !BLOQUEO.test(it.title) && marca.some(w => t.includes(w)) && nombre.every(w => t.includes(w));
};

async function precios(p) {
  const rates = await cached('fx', 3600e3, fx);
  let items, total = 0;
  if (!SERP) { // modo demo, claramente marcado
    items = [['Sephora Colombia',689000],['Falabella',712900],['Notino',655000]].map(([source, extracted_price]) => ({ source, extracted_price, title: `${p.marca} ${p.nombre}`, link: 'https://www.' + norm(source).split(' ')[0] + '.com' }));
  } else {
    const consulta = norm(p.nombre).includes(norm(p.marca)) ? p.nombre : `${p.marca} ${p.nombre}`;
    const u = `https://serpapi.com/search.json?engine=google_shopping&gl=co&hl=es&q=${enc(consulta + ' perfume')}&api_key=${SERP}`;
    const r = await fetch(u); if (!r.ok) throw new Error('serpapi ' + r.status);
    const todos = ((await r.json()).shopping_results || []).filter(it => it.extracted_price);
    total = todos.length; items = todos.filter(it => verificado(it, p));
  }
  const porTienda = new Map(); // una oferta (la más barata) por tienda
  for (const it of items) { const a = porTienda.get(it.source); if (!a || it.extracted_price < a.extracted_price) porTienda.set(it.source, it); }
  let tiendas = [...porTienda.values()].map(it => ({ tienda: it.source, precioCOP: it.extracted_price, url: it.link || it.product_link }));
  const med = [...tiendas].map(t => t.precioCOP).sort((a, b) => a - b)[Math.floor(tiendas.length / 2)];
  tiendas = tiendas.filter(t => t.precioCOP > med * 0.5).sort((a, b) => a.precioCOP - b.precioCOP); // descarta outliers sospechosos
  const promedioCOP = tiendas.length ? tiendas.reduce((s, t) => s + t.precioCOP, 0) / tiendas.length : null;
  return { demo: !SERP, descartados: total - items.length, actualizado: new Date().toISOString(), rates, tiendas, promedioCOP, masBarata: tiendas[0] || null };
}
app.get('/api/precios', async (req, res) => {
  const p = { nombre: String(req.query.nombre || '').slice(0, 80), marca: String(req.query.marca || '').slice(0, 40) };
  if (!p.nombre) return res.status(400).json({ error: 'nombre requerido' });
  try { res.set(CDN).json(await cached('p:' + norm(p.marca + p.nombre), Number(process.env.PRECIOS_TTL_MIN || 15) * 60e3, () => precios(p))); }
  catch { res.status(502).json({ error: 'precios no disponibles' }); }
});

app.get('/api/estado', (_, res) => res.json({ catalogo: !!FRA, precios: !!SERP }));

app.listen(PORT, () => console.log('API en :' + PORT, FRA && SERP ? '' : '(modo demo: faltan claves)'));
