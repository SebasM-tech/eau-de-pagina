import { useEffect, useState } from 'react';

import Firma from './Firma.jsx';



const COLOR = { amaderado:'#78431a', 'cítrico':'#fcff7a', 'aromático':'#76bfae', 'ámbar':'#d68c66', 'fresco especiado':'#b1dd75',

  atalcado:'#f3e9dc', 'cálido especiado':'#e08a6a', verde:'#7bbf82', lavanda:'#c9b6dc', dulce:'#e9a8c0', floral:'#f1b6cf',

  vainilla:'#f0d9a0', afrutado:'#f08a5d', almizclado:'#d9cfc4', cuero:'#6b4a3a', 'acuático':'#7fb8e0' };

// Color de acento por acorde (vivos, pensados para brillar sobre fondo oscuro). Admite nombres en español e inglés.

const ACENTO = { amaderado:'#b9803f', 'cítrico':'#e6d44a', 'aromático':'#4fb8a6', 'ámbar':'#d9843f', 'fresco especiado':'#7fc46a', atalcado:'#d8c3a5',

  'cálido especiado':'#d9603f', verde:'#4fae6a', lavanda:'#a48ad6', dulce:'#c9884a', floral:'#e98fb5', vainilla:'#e6c06a', afrutado:'#ee7a4a',

  almizclado:'#c9b8a8', cuero:'#8a5a3c', 'acuático':'#5fb4e8', fresco:'#6fd0e0', 'balsámico':'#a4703c', ahumado:'#8c8c96', terroso:'#8a6a42',

  tropical:'#f0a030', gourmand:'#b06a3c', oud:'#7a4a2a', iris:'#9a8ad0', 'pachulí':'#7a5a32', 'especiado':'#d0703a', rosa:'#e0507a',

  caramel:'#c9884a', tobacco:'#8a5a2c', coffee:'#6f4a30', chocolate:'#6a3f2a', honey:'#e0a83c', coconut:'#e8dcc4', salty:'#7fc8d8', marine:'#4fa8e0',

  ozonic:'#8ed0f0', mineral:'#9aa8b8', mossy:'#5a8a4a', soapy:'#bfe0f0', cherry:'#c0304a', almond:'#d8b890', animalic:'#8a6a4a', cinnamon:'#b0502a', nutty:'#b08850' };

// Perfumes emblemáticos con un color propio (se evalúa contra "marca nombre"). Agrega aquí los que quieras.

const OVERRIDES = [[/sauvage/i, '#7ec8f0'], [/liquid\s*brun/i, '#9a5b34'], [/bleu de chanel/i, '#3f78d0']];

const acentoDe = p => {

  const o = OVERRIDES.find(([r]) => r.test(`${p.marca} ${p.nombre}`)); if (o) return o[1];

  for (const x of p.acordes || []) { const c = ACENTO[String(x.nombre).toLowerCase()]; if (c) return c; }

  return '#c9a24b';

};

const DIVISAS = ['COP', 'USD', 'EUR', 'MXN', 'GBP', 'BRL'];

// Cada moneda indica el mercado local donde deben buscarse distribuidores oficiales.
const MERCADO_POR_MONEDA = {
  COP: { pais: 'CO', nombre: 'Colombia' },
  USD: { pais: 'US', nombre: 'Estados Unidos' },
  EUR: { pais: 'EU', nombre: 'Zona euro' },
  MXN: { pais: 'MX', nombre: 'México' },
  GBP: { pais: 'GB', nombre: 'Reino Unido' },
  BRL: { pais: 'BR', nombre: 'Brasil' },
};

const fmt = (v, c) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: c, maximumFractionDigits: c === 'COP' ? 0 : 2 }).format(v);

const oscuro = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140; };



const TR = { moderate: 'Moderada', 'long lasting': 'Larga', 'very long lasting': 'Muy larga', eternal: 'Eterna', weak: 'Suave', light: 'Ligera', strong: 'Fuerte', enormous: 'Enorme', men: 'Hombre', women: 'Mujer', unisex: 'Unisex' };

const BANDA = ['Solo perfumes originales', 'Tiendas verificadas', 'Precios en COP, USD y más', 'Actualización en segundo plano', 'Justo y lujoso'];



function Datos({ p }) {

  const d = p.datos || {};

  const t = v => TR[String(v).toLowerCase()] || v;

  const items = [['Lanzamiento', d.anio], ['Concentración', d.concentracion], ['Género', t(d.genero)], ['Duración', t(d.duracion)], ['Estela', t(d.estela)]].filter(([, v]) => v);

  return items.length ? <div className="datos">{items.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div> : null;

}



const Titulo = ({ n, id, children }) => <h3 className="titulo" id={id}><i>{n}</i><span>{children}</span></h3>;



function Acordes({ acordes }) {

  return (

    <div className="acordes">

      {acordes.map((a, i) => {

        const c = COLOR[a.nombre] || '#c9a24b';

        return <div key={a.nombre} className="barra" style={{ '--w': a.peso + '%', '--c': c, '--i': i, color: oscuro(c) ? '#f4efe6' : '#1b1b1b' }}><span>{a.nombre}</span></div>;

      })}

    </div>

  );

}



function Foto({ p }) {

  const fuentes = [p.imagen, ...(p.imagenes || [])].filter(Boolean);

  const [i, setI] = useState(0);

  useEffect(() => setI(0), [p.id]);

  return (

    <div className="vitrina">

      <div className="halo" />

      {fuentes[i] ? <img src={fuentes[i]} alt={p.nombre} onError={() => setI(i + 1)} /> : <div className="frasco">{p.marca}</div>}

    </div>

  );

}



// Color de cada nota según su familia (por palabras clave, en español e inglés). La primera regla que coincide gana.

const NOTAS_COLOR = [

  [/blossom|azahar|flor de/, '#e98fb5'],

  [/pimienta|pepper|jengibre|ginger|canela|cinnamon|clavo|clove|nuez moscada|nutmeg|cardamom|azafran|saffron|comino|cumin|coriand|cilantro|anis|anise|especia|spice/, '#d9603f'],

  [/limon|lemon|bergamot|naranja|orange|mandarin|pomelo|grapefruit|\blima\b|\blime\b|yuzu|citric|citrus|neroli|petitgrain|cidra|citron|toronja/, '#e6d44a'],

  [/lavand|lavender/, '#a48ad6'],

  [/menta|mint|basil|albahaca|\bhoja|leaf|galbanum|green|hierba|grass|\bte\b|\btea\b|romero|rosemary|salvia|sage|tomillo|thyme|eucalip|laurel|herb/, '#4fae6a'],

  [/marino|marine|agua|water|\bsal\b|salt|aqua|ocean|\bsea\b|brisa|breeze|ozon|lluvia|rain|\bice\b|hielo/, '#5fb4e8'],

  [/almizcle|musk|ambrette|cashmeran|cachemira|cashmere/, '#c9b8a8'],

  [/cuero|leather|piel|suede|\bante\b/, '#8a5a3c'],

  [/chocolate|cacao|cocoa|cafe|coffee|ron\b|\brum\b|cognac|whisk|tabaco|tobacco/, '#8a5a3a'],

  [/vainilla|vanilla|caramel|miel|honey|azucar|sugar|tonka|praline|almendra|almond|licor/, '#e0b25a'],

  [/manzana|apple|\bpera\b|pear|durazno|peach|melocot|melon|pina|pineapple|fresa|strawberry|frambuesa|raspberry|cassis|grosella|currant|cereza|cherry|ciruela|plum|mango|fruta|fruit|banana|platano|higo|\bfig\b|lichi|litchi|maracuy|passion|coco|coconut/, '#ee7a4a'],

  [/iris|orris|polvo|powder|talco|heliotrop/, '#d8c3a5'],

  [/jazmin|jasmine|\brosa\b|\brose\b|peon|peony|violet|lirio|lily|ylang|tuberos|gardenia|magnolia|freesia|geranio|geranium|\blila\b|lilac|mimosa|flor|flower|floral|orquidea|orchid|hedione/, '#e98fb5'],

  [/cedro|cedar|sandalo|sandal|vetiver|pachuli|patchouli|roble|\boak|musgo|moss|madera|wood|guayaco|guaiac|cipres|cypress|\bpino\b|\bpine\b|teca|\boud\b|agar|abedul|birch|ambroxan|iso e/, '#b9803f'],

  [/incienso|incense|olibano|frankincense|mirra|myrrh|ladano|labdanum|ambar|amber|benjui|benzoin|resina|resin|balsam|styrax|opopanax|elemi/, '#d9843f'],

];

const colorNota = n => {

  const t = String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return (NOTAS_COLOR.find(([r]) => r.test(t)) || [])[1] || null;

};



function Piramide({ notas }) {

  return (

    <div className="piramide">

      {[['I', 'Salida', notas.salida], ['II', 'Corazón', notas.corazon], ['III', 'Fondo', notas.fondo]].map(([n, t, l]) => {

        const nc = (l || []).map(colorNota).find(Boolean); // el nivel toma el color de su primera nota reconocida

        return (

          <div key={t} className="nivel" style={nc ? { '--nc': nc } : undefined}>

            <span className="num">{n}</span><h4>{t}</h4>

            <div className="tags">{l?.length ? l.map(x => { const c = colorNota(x); return <span key={x} style={c ? { '--n': c } : undefined}>{x}</span>; }) : <em>—</em>}</div>

          </div>

        );

      })}

    </div>

  );

}



function Precios({ perfume, monedas }) {

  const [d, setD] = useState(null);

  const [err, setErr] = useState(false);

  useEffect(() => {

    let vivo = true;

    const monedasSeleccionadas = monedas.length ? monedas : ['COP'];
    const paisesSeleccionados = [...new Set(monedasSeleccionadas.map(c => MERCADO_POR_MONEDA[c]?.pais).filter(Boolean))];
    const cargar = () => fetch(
      `/api/precios?nombre=${encodeURIComponent(perfume.nombre)}` +
      `&marca=${encodeURIComponent(perfume.marca)}` +
      `&monedas=${encodeURIComponent(monedasSeleccionadas.join(','))}` +
      `&paises=${encodeURIComponent(paisesSeleccionados.join(','))}`
    )

      .then(r => r.json().then(j => r.ok ? j : Promise.reject(j.error))).then(j => { if (vivo) { setD(j); setErr(false); } }).catch(e => vivo && setErr(typeof e === 'string' ? e : true));

    setD(null); cargar();

    const t = setInterval(cargar, 5 * 60e3);

    return () => { vivo = false; clearInterval(t); };

  }, [perfume.id, monedas.join(',')]);



  if (err && !d) return <p className="aviso">No pudimos consultar precios ahora. Reintentaremos automáticamente.{typeof err === 'string' && <><br />Detalle: {err}</>}</p>;

  if (!d) return <div className="skeleton" />;

  const conv = (cop, c) => fmt(cop * (d.rates[c] ?? 1), c);

  return (

    <section>

      {d.demo && <p className="aviso">Datos de demostración: configura SERPAPI_KEY para precios reales.</p>}

      {d.masBarata ? (

        <>

          <div className="destacado">

            <span className="etiqueta">Mejor precio · {d.masBarata.tienda}</span>

            <strong>{monedas.map(c => <em key={c}>{conv(d.masBarata.precioCOP, c)}</em>)}</strong>

            <a className="cta" href={d.masBarata.url} target="\_blank" rel="noopener noreferrer">Comprar al mejor precio</a>

          </div>

          <p className="promedio">Promedio entre {d.tiendas.length} tiendas verificadas <b>{monedas.map(c => conv(d.promedioCOP, c)).join('  ·  ')}</b></p>

          <div className="tabla">

            {d.tiendas.map((t, i) => (

              <a key={t.tienda} href={t.url} target="\_blank" rel="noopener noreferrer" className="fila" style={{ '--i': i, '--p': t.precioCOP / Math.max(...d.tiendas.map(x => x.precioCOP)) }}>

                <span className="pos">{String(i + 1).padStart(2, '0')}</span>

                <span className="tienda">{t.tienda}{i === 0 && <b className="sello">Mejor precio</b>}</span>

                <span className="monto">{monedas.map(c => conv(t.precioCOP, c)).join('  ·  ')}</span>

              </a>

            ))}

          </div>

        </>

      ) : <p className="aviso">Sin ofertas verificadas por ahora.</p>}

      <small>{d.descartados > 0 && `${d.descartados} ofertas descartadas por no ser de tiendas verificadas. `}Actualizado {new Date(d.actualizado).toLocaleTimeString('es-CO')} · Solo tiendas autorizadas; se excluyen réplicas, inspirados, decants, testers y precios atípicos.</small>

    </section>

  );

}



export default function App() {

  const [q, setQ] = useState('');

  const [lista, setLista] = useState([]);

  const [sel, setSel] = useState(null);

  const [monedas, setMonedas] = useState(['COP', 'USD']);

  const [tema, setTema] = useState('dark');

  const [estado, setEstado] = useState(null);

  const [errCat, setErrCat] = useState(false);

  useEffect(() => { fetch('/api/estado').then(r => r.json()).then(setEstado).catch(() => {}); }, []);

  useEffect(() => { document.documentElement.dataset.tema = tema; }, [tema]);

  useEffect(() => { // foco de luz dorado que sigue el cursor sobre las tarjetas

    const f = e => {

      const t = e.target.closest?.('.nivel,.destacado,.fila'); if (!t) return;

      const r = t.getBoundingClientRect(); t.style.setProperty('--mx', e.clientX - r.left + 'px'); t.style.setProperty('--my', e.clientY - r.top + 'px');

    };

    window.addEventListener('pointermove', f); return () => window.removeEventListener('pointermove', f);

  }, []);

  useEffect(() => {

    const t = setTimeout(() => fetch(`/api/perfumes?q=${encodeURIComponent(q)}`).then(r => r.json())

      .then(d => { if (!Array.isArray(d)) throw 0; setErrCat(false); setLista(d); setSel(s => s && d.some(p => p.id === s.id) ? s : d[0] || null); }).catch(() => setErrCat(true)), 300);

    return () => clearTimeout(t);

  }, [q]);

  const alternar = c => setMonedas(m => m.includes(c) ? (m.length > 1 ? m.filter(x => x !== c) : m) : [...m, c]);



  return (

    <>

      <header className="cabecera">

        <a href="#" className="insignia" aria-label="Eau de Pagina — inicio">

          <span className="emblema"><img src="/logo.png" alt="Eau de Pagina — Justo y lujoso" /></span>

          <span className="nombre">Eau de Pagina</span>

        </a>

        <nav><a href="#notas">Notas</a><a href="#precios">Precios</a></nav>

        <button className="tema" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')} aria-label="Cambiar tema">{tema === 'dark' ? '☾' : '☀'}</button>

      </header>

      <div className="franja" aria-hidden="true"><div className="cinta">{[...BANDA, ...BANDA, ...BANDA, ...BANDA].map((t, i) => <span key={i}>{t}</span>)}</div></div>

      <main style={{ '--ac': sel ? acentoDe(sel) : 'var(--gold)', '--ac-on': sel && oscuro(acentoDe(sel)) ? '#f4efe6' : '#14110a' }}>

        <section className="portada">

          <p className="lema">Descubre <b>◆</b> Compara <b>◆</b> Elige</p>

          <h2 className="eslogan">El arte de elegir tu fragancia</h2>

          {estado && (!estado.catalogo || !estado.precios) && <p className="aviso">Modo demo: falta {[!estado.catalogo && 'FRAGELLA_KEY (catálogo completo e imágenes)', !estado.precios && 'SERPAPI_KEY (precios reales)'].filter(Boolean).join(' y ')} en el archivo .env</p>}

          {errCat && <p className="aviso">No se pudo consultar el catálogo. Revisa la clave FRAGELLA_KEY y la terminal de la API.</p>}

          <div className="busqueda">

            <input className="buscador" placeholder="Busca un perfume o una marca…" value={q} onChange={e => setQ(e.target.value)} />

          </div>

          <div className="chips carrusel">{lista.map(p => (

            <button key={p.id} className={sel?.id === p.id ? 'on' : ''} onClick={() => setSel(p)}>{p.nombre}</button>))}

          </div>

        </section>

        {sel && (

          <article key={sel.id}>

            <div className="hero" data-marca={sel.marca}>

              <Foto p={sel} />

              <div className="ficha">

                <p className="marca">{sel.marca}</p>

                <h1>{sel.nombre}</h1>

                <div className="filete"><b>◆</b></div>

                <p className="subtitulo">Familias olfativas</p>

                <Acordes acordes={sel.acordes} />

              </div>

            </div>

            <Datos p={sel} />

            <Titulo n="I" id="notas">Pirámide olfativa</Titulo>

            <Piramide notas={sel.notas} />

            <Titulo n="II" id="precios">Comparativa de precios</Titulo>

            <div className="chips">{DIVISAS.map(c => (

              <button key={c} className={monedas.includes(c) ? 'on' : ''} onClick={() => alternar(c)}>{c}</button>))}

            </div>

            <Precios perfume={sel} monedas={monedas} />

          </article>

        )}

      </main>

      <footer className="pie">

        <div className="firma-bloque">

          <span className="equis">✕</span>

          <Firma />

          <span className="linea" />

          <span className="leyenda">Justo y lujoso</span>

        </div>

        <div className="legal">

          <nav><a href="#notas">Notas</a><a href="#precios">Precios</a></nav>

          <p>© {new Date().getFullYear()} Eau de Pagina. Todos los derechos reservados.</p>

          <small>Los precios son orientativos; confirma siempre en la tienda.</small>

        </div>

      </footer>

    </>

  );

}