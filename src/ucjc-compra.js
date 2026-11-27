// Compra C · <ucjc-compra>
// Cumple presentacion-campus@1: colores, tipografía, radios y espacios salen de --ucjc-* (con valor
// de reserva), sin la marca «important», y todo listener puesto en window se quita en disconnectedCallback.
//
// Eventos:
//   escucha  ucjc:descubrimiento:anadir-al-carrito@1   (firmado)   { productoId, nombre, precio (€), cantidad }
//   escucha  ucjc:identidad:sesion-cambiada@1          (firmado)   { autenticado, usuario | null }
//   escucha  ucjc:descubrimiento:campana-cambiada@1    (firmado)   { activa, codigo, etiqueta, momento }
//   escucha  ucjc:descubrimiento:moneda-cambiada@1     (propuesto) { moneda, momento }
//   emite    ucjc:compra:pedido-confirmado@1           (firmado)   { pedidoId, usuarioId, creadoEn, total, lineas[] }  · en euros
//   emite    ucjc:compra:pedido-confirmado@2           (propuesto) apagado con EMITIR_PEDIDO_V2

const EVT_ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const EVT_SES = 'ucjc:identidad:sesion-cambiada@1';
const EVT_CAMPANA = 'ucjc:descubrimiento:campana-cambiada@1';
const EVT_MONEDA = 'ucjc:descubrimiento:moneda-cambiada@1';
const EVT_PED = 'ucjc:compra:pedido-confirmado@1';
const EVT_PED_V2 = 'ucjc:compra:pedido-confirmado@2';

// pedido-confirmado@2 sigue PROPUESTO: «Mientras esté propuesto, Compra sigue emitiendo el @1».
export const EMITIR_PEDIDO_V2 = false;

const CLAVE_GUARDADO = 'ucjc-compra:carrito';
const MAX_POR_LINEA = 99;

// La moneda NO se elige en Compra: la marca el catálogo con moneda-cambiada@1.
// El precio llega siempre en euros (anadir-al-carrito@1); para enseñarlo en la moneda del catálogo
// se convierte con el tipo de referencia del BCE (16/11/2026), redondeando hacia abajo: nunca de más.
export const MONEDAS = {
  EUR: { simbolo: '€', nombre: 'euros', tasa: 1 },
  USD: { simbolo: '$', nombre: 'dólares', tasa: 1.1014 },
  GBP: { simbolo: '£', nombre: 'libras', tasa: 0.8345 },
};

// ---------- Utilidades ----------
const aCent = (euros) => Math.round(euros * 100);
const deCent = (cent) => cent / 100;
const enMoneda = (precioEur, moneda) => Math.floor(aCent(precioEur) * MONEDAS[moneda].tasa + 1e-9);
const importe = (cent, moneda = 'EUR') => `${deCent(cent).toFixed(2).replace('.', ',')} ${MONEDAS[moneda].simbolo}`;

const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const hora = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function nuevoPedidoId() {
  const fecha = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const azar = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2))
    .replaceAll('-', '')
    .slice(0, 6)
    .toUpperCase();
  return `PED-${fecha}-${azar}`;
}

// ---------- Campus (presentacion-campus@1) ----------
// Fuera de la tienda (página de demo, tests) no hay ucjcCampus: se usa window directamente.
const campus = () => (globalThis.window?.ucjcCampus?.version === '1' ? window.ucjcCampus : null);

function escuchar(nombre, manejador) {
  const c = campus();
  if (c) return c.escuchar(nombre, manejador);
  window.addEventListener(nombre, manejador);
  return () => window.removeEventListener(nombre, manejador);
}

function emitir(nombre, detail) {
  const c = campus();
  if (c) c.emitir(nombre, detail);
  else window.dispatchEvent(new CustomEvent(nombre, { detail }));
}

// ---------- Líneas del carrito ----------
// Una línea = producto + moneda + campaña. Si cambia cualquiera de las tres, es otra línea:
// el mismo producto en Black Friday o en dólares no tiene el mismo precio.
const claveLinea = (l) => `${l.productoId}|${l.moneda}|${l.campana ?? ''}`;

// Valida el detail de anadir-al-carrito@1 (solo sus 4 campos).
function productoValido(d) {
  if (!d || typeof d !== 'object') return null;
  const productoId = d.productoId == null ? '' : String(d.productoId).trim();
  const nombre = typeof d.nombre === 'string' ? d.nombre.trim() : '';
  const precio = Number(d.precio);
  const cantidad = Number(d.cantidad);
  if (!productoId || !nombre) return null;
  if (!Number.isFinite(precio) || precio < 0) return null;
  if (!Number.isInteger(cantidad) || cantidad < 1) return null;
  return { productoId, nombre, precio, cantidad };
}

// Valida una línea guardada (producto + moneda + campaña).
function lineaGuardada(d) {
  const p = productoValido(d);
  if (!p) return null;
  const moneda = d.moneda in MONEDAS ? d.moneda : 'EUR';
  const campana = typeof d.campana === 'string' && d.campana ? d.campana : null;
  const etiqueta = campana && typeof d.etiqueta === 'string' && d.etiqueta ? d.etiqueta : campana;
  return { ...p, moneda, campana, etiqueta };
}

const guardado = {
  leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '[]');
      return Array.isArray(datos) ? datos.map(lineaGuardada).filter(Boolean) : [];
    } catch {
      return [];
    }
  },
  escribir(lineas) {
    try {
      localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(lineas));
    } catch {
      /* sin almacenamiento: el carrito vive solo en memoria */
    }
  },
};

// ---------- Estilos: solo tokens --ucjc-* (el color a mano solo aparece como reserva) ----------
const css = `
  :host {
    display: block;
    font-family: var(--ucjc-font-sans, "Segoe UI", sans-serif);
    font-size: 1rem;
    line-height: 1.5;
    color: var(--ucjc-ink, #1a242c);
  }
  * { box-sizing: border-box; }

  header {
    background: var(--ucjc-brand, #0b3d4a);
    color: var(--ucjc-panel, #fbfcfb);
    padding: var(--ucjc-space, 0.75rem) var(--ucjc-space-lg, 1.25rem);
    display: flex; justify-content: space-between; align-items: center;
    gap: var(--ucjc-space, 0.75rem); flex-wrap: wrap;
  }
  header h1 {
    margin: 0; font-size: 1.25rem;
    font-family: var(--ucjc-font-display, Georgia, serif);
    display: flex; align-items: center; gap: 0.5rem;
  }
  .contador {
    font-family: var(--ucjc-font-sans, "Segoe UI", sans-serif);
    font-size: 0.8rem; font-weight: 700; padding: 0 0.55rem; border-radius: 999px;
    background: var(--ucjc-panel, #fbfcfb); color: var(--ucjc-brand, #0b3d4a);
  }
  .chip {
    font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 999px;
    background: var(--ucjc-panel, #fbfcfb); color: var(--ucjc-leaf, #2f6f4e);
    max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .chip.sin { color: var(--ucjc-warn, #8a3a3a); }

  .campana {
    display: flex; align-items: center; gap: var(--ucjc-space, 0.75rem); flex-wrap: wrap;
    padding: var(--ucjc-space, 0.75rem) var(--ucjc-space-lg, 1.25rem);
    background: var(--ucjc-brand-bright, #146b7a); color: var(--ucjc-panel, #fbfcfb);
    font-weight: 700;
  }
  .campana small { font-weight: 400; }

  main { max-width: var(--ucjc-max, 72rem); margin: var(--ucjc-space-lg, 1.25rem) auto; padding: 0 var(--ucjc-space, 0.75rem); }
  .contenido { max-width: 44rem; margin: 0 auto; }

  ol.pasos { display: flex; gap: 0.4rem; list-style: none; padding: 0; margin: 0 0 var(--ucjc-space, 0.75rem); font-size: 0.8rem; }
  ol.pasos li {
    flex: 1; text-align: center; padding: 0.25rem; border-radius: var(--ucjc-radius, 6px);
    background: var(--ucjc-mist, #e6ece8); color: var(--ucjc-muted, #5a6a76);
  }
  ol.pasos li.hecho { background: var(--ucjc-brand, #0b3d4a); color: var(--ucjc-panel, #fbfcfb); font-weight: 700; }

  h2 { font-family: var(--ucjc-font-display, Georgia, serif); font-size: 1.25rem; margin: 0 0 0.25rem; }
  .sub { margin: 0 0 var(--ucjc-space, 0.75rem); color: var(--ucjc-muted, #5a6a76); font-size: 0.9rem; }

  .box {
    background: var(--ucjc-panel, #fbfcfb);
    border: 1px solid var(--ucjc-edge, #c9d3cd);
    border-radius: var(--ucjc-radius, 6px);
    padding: var(--ucjc-space-lg, 1.25rem);
  }
  .lista { max-height: 20rem; overflow-y: auto; border-bottom: 1px solid var(--ucjc-mist, #e6ece8); }
  table { width: 100%; border-collapse: collapse; }
  th {
    position: sticky; top: 0; z-index: 1; text-align: left; font-size: 0.8rem; padding: 0.4rem 0.25rem;
    background: var(--ucjc-panel, #fbfcfb); color: var(--ucjc-muted, #5a6a76);
    border-bottom: 1px solid var(--ucjc-edge, #c9d3cd);
  }
  td { padding: 0.5rem 0.25rem; border-bottom: 1px solid var(--ucjc-mist, #e6ece8); vertical-align: middle; }
  .r { text-align: right; }
  .ud { display: block; font-size: 0.75rem; color: var(--ucjc-muted, #5a6a76); }
  .etiquetas { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.2rem; }
  .etiqueta {
    font-size: 0.7rem; font-weight: 700; padding: 0.05rem 0.45rem; border-radius: 999px;
    border: 1px solid var(--ucjc-edge, #c9d3cd); color: var(--ucjc-muted, #5a6a76);
  }
  .etiqueta.bf { background: var(--ucjc-brand-bright, #146b7a); border-color: var(--ucjc-brand-bright, #146b7a); color: var(--ucjc-panel, #fbfcfb); }

  .cant { display: inline-flex; align-items: center; gap: 0.4rem; }
  .cant output { min-width: 1.5em; text-align: center; font-variant-numeric: tabular-nums; }
  .cant button { width: 2rem; height: 2rem; padding: 0; border-radius: 50%; font-size: 1.05rem; line-height: 1; }
  .quitar { padding: 0.2rem 0.55rem; font-size: 0.8rem; }
  .vacio { color: var(--ucjc-muted, #5a6a76); font-style: italic; text-align: center; padding: var(--ucjc-space-lg, 1.25rem) 0.25rem; }

  .totales { margin: var(--ucjc-space, 0.75rem) 0; }
  .total { display: flex; justify-content: space-between; align-items: baseline; margin: 0.3rem 0; font-size: 0.95rem; }
  .total small { color: var(--ucjc-muted, #5a6a76); font-size: 0.85rem; }
  .total.final { font-size: 1.15rem; padding-top: 0.4rem; border-top: 1px solid var(--ucjc-mist, #e6ece8); }

  .row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  button {
    font: inherit; font-size: 0.95rem; cursor: pointer;
    padding: 0.5rem var(--ucjc-space, 0.75rem);
    border: 1px solid var(--ucjc-edge, #c9d3cd); border-radius: var(--ucjc-radius, 6px);
    background: var(--ucjc-mist, #e6ece8); color: var(--ucjc-ink, #1a242c);
    transition: background-color 0.15s var(--ucjc-ease, ease);
  }
  button:hover:not(:disabled) { background: var(--ucjc-fog, #f3f6f4); }
  button.main {
    margin-left: auto; font-weight: 700;
    background: var(--ucjc-brand-bright, #146b7a); border-color: var(--ucjc-brand-bright, #146b7a);
    color: var(--ucjc-panel, #fbfcfb);
  }
  button.main:hover:not(:disabled) { background: var(--ucjc-brand, #0b3d4a); }
  button.enlace { background: none; border: none; padding: 0 0.25rem; color: var(--ucjc-brand-bright, #146b7a); text-decoration: underline; font-weight: 700; }
  button:disabled { cursor: not-allowed; opacity: 0.55; }
  button:focus-visible { outline: 3px solid var(--ucjc-brand-bright, #146b7a); outline-offset: 2px; }

  .motivo { margin: var(--ucjc-space, 0.75rem) 0 0; font-size: 0.9rem; color: var(--ucjc-warn, #8a3a3a); text-align: right; }
  .ok { margin: var(--ucjc-space, 0.75rem) 0 0; font-size: 0.9rem; color: var(--ucjc-leaf, #2f6f4e); min-height: 1.2em; }
  .ok.aviso { color: var(--ucjc-warn, #8a3a3a); }

  .resumen {
    margin-top: var(--ucjc-space-lg, 1.25rem); padding: var(--ucjc-space, 0.75rem) var(--ucjc-space-lg, 1.25rem);
    background: var(--ucjc-fog, #f3f6f4);
    border: 1px solid var(--ucjc-leaf, #2f6f4e); border-radius: var(--ucjc-radius, 6px);
  }
  .resumen h3 { margin: 0 0 0.4rem; font-family: var(--ucjc-font-display, Georgia, serif); font-size: 1rem; color: var(--ucjc-leaf, #2f6f4e); }
  .resumen p { margin: 0 0 0.5rem; font-size: 0.9rem; color: var(--ucjc-muted, #5a6a76); }
  .resumen ul { margin: 0 0 0.5rem; padding-left: 1.1rem; font-size: 0.9rem; }

  @media (max-width: 520px) {
    table, tbody, tr, td { display: block; width: 100%; }
    tr.cabecera { display: none; }
    tr { display: grid; grid-template-columns: 1fr auto; gap: 0.25rem 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid var(--ucjc-mist, #e6ece8); }
    td { border: none; padding: 0.1rem 0; }
    td.r { text-align: left; }
    td.subtotal, td.acciones { text-align: right; }
    button.main { width: 100%; margin-left: 0; }
  }
`;

class UcjcCompra extends HTMLElement {
  #lineas = guardado.leer();
  #usuario = null; // { id, email, nombre? } de Identidad
  #campana = null; // { codigo, etiqueta } mientras Descubrimiento la tenga activa
  #moneda = 'EUR'; // moneda del catálogo (moneda-cambiada@1)
  #flash = { texto: '', tipo: 'ok' };
  #deshacer = null;
  #ultimoPedido = null;
  #quitar = []; // funciones que dejan de escuchar (se llaman en disconnectedCallback)

  get #usuarioId() {
    return this.#usuario?.id ?? null;
  }

  // ---------- Escucha: anadir-al-carrito@1 ----------
  #onAdd = (e) => {
    const p = productoValido(e.detail);
    if (!p) {
      console.warn(`[compra] ${EVT_ADD} con datos que no cumplen el contrato; se ignora`, e.detail);
      return;
    }
    // Se etiqueta con la moneda y la campaña que tenía el catálogo en ese momento.
    const nueva = {
      ...p,
      moneda: this.#moneda,
      campana: this.#campana?.codigo ?? null,
      etiqueta: this.#campana?.etiqueta ?? null,
    };
    const existente = this.#lineas.find((l) => claveLinea(l) === claveLinea(nueva));
    const actual = existente ? existente.cantidad : 0;
    const total = Math.min(MAX_POR_LINEA, actual + nueva.cantidad);
    if (existente) existente.cantidad = total;
    else this.#lineas.push({ ...nueva, cantidad: total });

    this.#deshacer = null;
    const tope = total < actual + nueva.cantidad;
    this.#avisar(
      tope ? `Máximo ${MAX_POR_LINEA} unidades de «${nueva.nombre}»` : `Añadido: ${nueva.nombre}${nueva.etiqueta ? ` (${nueva.etiqueta})` : ''}`,
      tope ? 'aviso' : 'ok',
    );
  };

  // ---------- Escucha: sesion-cambiada@1 ----------
  #onSes = (e) => {
    const d = e.detail || {};
    const antes = this.#usuarioId;
    const u = d.autenticado === true && d.usuario && d.usuario.id != null ? d.usuario : null;
    this.#usuario = u ? { id: String(u.id), email: u.email ?? '', nombre: u.nombre ?? '' } : null;
    if (antes !== this.#usuarioId) {
      this.#flash = { texto: '', tipo: 'ok' };
      this.#ultimoPedido = null;
    }
    this.#pintar();
  };

  // ---------- Escucha: campana-cambiada@1 ----------
  #onCampana = (e) => {
    const d = e.detail || {};
    if (typeof d.activa !== 'boolean' || typeof d.codigo !== 'string' || !d.codigo) {
      console.warn(`[compra] ${EVT_CAMPANA} con datos que no cumplen el contrato; se ignora`, d);
      return;
    }
    const etiqueta = typeof d.etiqueta === 'string' && d.etiqueta ? d.etiqueta : d.codigo;
    const antes = this.#campana?.codigo ?? null;
    this.#campana = d.activa ? { codigo: d.codigo, etiqueta } : null;
    if (antes === (this.#campana?.codigo ?? null)) {
      this.#pintar(); // aviso repetido (p. ej. al cargar): sin mensaje
      return;
    }
    this.#avisar(d.activa ? `${etiqueta} activado: lo que añadas ahora lleva su descuento.` : `${etiqueta} ha terminado.`);
  };

  // ---------- Escucha: moneda-cambiada@1 ----------
  #onMoneda = (e) => {
    const m = e.detail?.moneda;
    if (!(m in MONEDAS)) {
      console.warn(`[compra] ${EVT_MONEDA} con una moneda que no conocemos; se ignora`, e.detail);
      return;
    }
    if (m === this.#moneda) return;
    this.#moneda = m;
    this.#pintar();
  };

  connectedCallback() {
    if (!campus()) console.warn('[compra] sin campus: se usan los valores de reserva y window.dispatchEvent');
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Este listener está en la sombra de la pieza, no en window: vive y muere con ella.
      this.shadowRoot.addEventListener('click', (e) => this.#clic(e));
    }
    // Lo que se pone, se quita (disconnectedCallback).
    this.#quitar.forEach((q) => q());
    this.#quitar = [
      escuchar(EVT_ADD, this.#onAdd),
      escuchar(EVT_SES, this.#onSes),
      escuchar(EVT_CAMPANA, this.#onCampana),
      escuchar(EVT_MONEDA, this.#onMoneda),
    ];
    this.#pintar();
  }

  disconnectedCallback() {
    this.#quitar.forEach((q) => q());
    this.#quitar = [];
  }

  // ---------- Cálculos ----------
  // Total en céntimos de euro: lo que se cobra y lo que manda pedido-confirmado@1.
  #totalCent(lineas = this.#lineas) {
    return lineas.reduce((s, l) => s + aCent(l.precio) * l.cantidad, 0);
  }

  // Subtotal de las líneas de una moneda, en céntimos de esa moneda.
  #totalEnMoneda(moneda, lineas = this.#lineas) {
    return lineas.filter((l) => l.moneda === moneda).reduce((s, l) => s + enMoneda(l.precio, moneda) * l.cantidad, 0);
  }

  #monedasUsadas(lineas = this.#lineas) {
    return Object.keys(MONEDAS).filter((m) => lineas.some((l) => l.moneda === m));
  }

  #unidades() {
    return this.#lineas.reduce((s, l) => s + l.cantidad, 0);
  }

  #motivo() {
    if (!this.#lineas.length) return 'El carrito está vacío: añade un producto del catálogo para poder confirmar.';
    if (!this.#usuarioId) return 'Inicia sesión en Identidad para confirmar el pedido.';
    return null;
  }

  // ---------- Emite: pedido-confirmado@1 (y @2 cuando se firme) ----------
  #confirmar() {
    if (this.#motivo()) return;
    const lineas = this.#lineas.map((l) => ({ ...l }));
    // @1: exactamente sus 5 campos, siempre en euros.
    const detail = {
      pedidoId: nuevoPedidoId(),
      usuarioId: this.#usuarioId,
      creadoEn: new Date().toISOString(),
      total: deCent(this.#totalCent(lineas)),
      lineas: lineas.map(({ productoId, nombre, precio, cantidad }) => ({ productoId, nombre, precio, cantidad })),
    };
    this.#lineas = [];
    this.#deshacer = null;
    this.#ultimoPedido = { ...detail, detalle: lineas };
    emitir(EVT_PED, detail);
    if (EMITIR_PEDIDO_V2) emitir(EVT_PED_V2, this.#detalleV2(detail, lineas));
    this.#avisar(`Pedido ${detail.pedidoId} confirmado (${importe(aCent(detail.total))})`);
  }

  // @2 lleva UNA moneda y como mucho UNA campaña para todo el pedido.
  // Si el carrito mezcla monedas, el pedido va en euros; si mezcla campañas, sin campaña.
  #detalleV2(detail, lineas) {
    const monedas = this.#monedasUsadas(lineas);
    const moneda = monedas.length === 1 ? monedas[0] : 'EUR';
    const campanas = [...new Set(lineas.map((l) => l.campana))];
    const v2 = {
      pedidoId: detail.pedidoId,
      usuarioId: detail.usuarioId,
      creadoEn: detail.creadoEn,
      moneda,
      total: moneda === 'EUR' ? detail.total : deCent(this.#totalEnMoneda(moneda, lineas)),
      lineas: lineas.map(({ productoId, nombre, precio, cantidad }) => ({
        productoId,
        nombre,
        precio: moneda === 'EUR' ? precio : deCent(enMoneda(precio, moneda)),
        cantidad,
      })),
    };
    if (campanas.length === 1 && campanas[0]) v2['campaña'] = campanas[0];
    return v2;
  }

  #cambiar(clave, delta) {
    const l = this.#lineas.find((x) => claveLinea(x) === clave);
    if (!l) return;
    if (delta > 0 && l.cantidad >= MAX_POR_LINEA) {
      this.#avisar(`Máximo ${MAX_POR_LINEA} unidades de «${l.nombre}»`, 'aviso');
      return;
    }
    l.cantidad += delta;
    if (l.cantidad < 1) {
      this.#lineas = this.#lineas.filter((x) => x !== l);
      this.#avisar(`Quitado: ${l.nombre}`);
      return;
    }
    this.#avisar('');
  }

  #vaciar() {
    if (!this.#lineas.length) return;
    this.#deshacer = this.#lineas.map((l) => ({ ...l }));
    this.#lineas = [];
    this.#avisar('Carrito vaciado.');
  }

  #recuperar() {
    if (!this.#deshacer) return;
    this.#lineas = this.#deshacer;
    this.#deshacer = null;
    this.#avisar('Carrito recuperado.');
  }

  #avisar(texto, tipo = 'ok') {
    this.#flash = { texto, tipo };
    guardado.escribir(this.#lineas);
    this.#pintar();
  }

  #clic(e) {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.a === 'ok') this.#confirmar();
    else if (b.dataset.a === 'vaciar') this.#vaciar();
    else if (b.dataset.a === 'deshacer') this.#recuperar();
    else if (b.dataset.mas) this.#cambiar(b.dataset.mas, +1);
    else if (b.dataset.menos) this.#cambiar(b.dataset.menos, -1);
    else if (b.dataset.quitar) this.#cambiar(b.dataset.quitar, -Infinity);
  }

  // ---------- Pintar ----------
  #etiquetas(l) {
    const tags = [];
    if (l.campana) tags.push(`<span class="etiqueta bf" data-campana="${esc(l.campana)}">🏷️ ${esc(l.etiqueta || l.campana)}</span>`);
    if (l.moneda !== 'EUR') tags.push(`<span class="etiqueta" data-moneda-linea="${l.moneda}">${l.moneda}</span>`);
    return tags.length ? `<span class="etiquetas">${tags.join('')}</span>` : '';
  }

  #pintar() {
    const r = this.shadowRoot;
    if (!r) return;

    const activo = r.activeElement;
    const claveFoco = activo?.dataset
      ? Object.entries(activo.dataset)
          .map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}="${String(v).replace(/["\\]/g, '\\$&')}"]`)
          .join('')
      : '';

    const motivo = this.#motivo();
    const hay = this.#lineas.length > 0;
    const unidades = this.#unidades();
    const u = this.#usuario;
    const c = this.#campana;

    const filas = hay
      ? this.#lineas
          .map((l) => {
            const n = esc(l.nombre);
            const k = esc(claveLinea(l));
            const unidad = enMoneda(l.precio, l.moneda);
            return `<tr data-linea="${k}">
              <td>${n}
                <span class="ud">${importe(unidad, l.moneda)} / ud.${l.moneda === 'EUR' ? '' : ` · ${importe(aCent(l.precio))}`}</span>
                ${this.#etiquetas(l)}
              </td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${k}" aria-label="Quitar una unidad de ${n}">−</button>
                <output aria-label="Cantidad de ${n}">${l.cantidad}</output>
                <button type="button" data-mas="${k}" aria-label="Añadir una unidad de ${n}" ${l.cantidad >= MAX_POR_LINEA ? 'disabled' : ''}>+</button>
              </span></td>
              <td class="r subtotal">${importe(unidad * l.cantidad, l.moneda)}</td>
              <td class="r acciones"><button type="button" class="quitar" data-quitar="${k}" aria-label="Quitar ${n} del carrito">Quitar</button></td>
            </tr>`;
          })
          .join('')
      : '<tr><td colspan="4" class="vacio">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>';

    // Subtotales por moneda solo si hay algo que no está en euros; el total que se cobra, en euros.
    const monedas = this.#monedasUsadas();
    // Todo en una sola moneda distinta del euro → el total se da en esa moneda (y su equivalente en €).
    const unaMoneda = monedas.length === 1 && monedas[0] !== 'EUR' ? monedas[0] : null;
    const subtotales =
      hay && monedas.length > 1
        ? monedas
            .map((m) => `<p class="total" data-subtotal="${m}"><small>Productos en ${MONEDAS[m].nombre}</small><span>${importe(this.#totalEnMoneda(m), m)}</span></p>`)
            .join('')
        : '';
    const enCampana = this.#lineas.filter((l) => l.campana).reduce((s, l) => s + l.cantidad, 0);

    const p = this.#ultimoPedido;
    const resumen = p
      ? `<section class="resumen" aria-label="Último pedido confirmado">
          <h3>✅ Pedido confirmado</h3>
          <p><b>${esc(p.pedidoId)}</b> · ${hora(p.creadoEn)} · ${esc(u?.email || p.usuarioId)}</p>
          <ul>${p.detalle
            .map((l) => `<li>${l.cantidad} × ${esc(l.nombre)}${l.campana ? ` <b>(${esc(l.etiqueta || l.campana)})</b>` : ''} — ${importe(enMoneda(l.precio, l.moneda) * l.cantidad, l.moneda)}</li>`)
            .join('')}</ul>
          <p class="total final"><span>Total pagado</span><b>${importe(aCent(p.total))}</b></p>
        </section>`
      : '';

    r.innerHTML = `
      <style>${css}</style>
      <header>
        <h1>UCJC Compra${unidades ? ` <span class="contador" aria-label="${unidades} artículos en el carrito">${unidades}</span>` : ''}</h1>
        <span class="chip ${u ? '' : 'sin'}" title="${u ? esc(u.email) : ''}">${u ? `Sesión: ${esc(u.nombre || u.email || u.id)}` : 'Sin sesión'}</span>
      </header>
      ${c ? `<div class="campana" role="status" data-campana-activa="${esc(c.codigo)}">🏷️ ${esc(c.etiqueta)} activo <small>Los productos que añadas ahora llevan el descuento de la campaña.</small></div>` : ''}
      <main><div class="contenido">
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${hay ? 'hecho' : ''}">1. Carrito</li>
          <li class="${u ? 'hecho' : ''}">2. Sesión</li>
          <li class="${motivo ? '' : 'hecho'}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Precios y moneda según el catálogo. Un mismo producto en otra moneda o en campaña aparece en una línea aparte.</p>
        <div class="box">
          <div class="lista"><table>
            <tr class="cabecera"><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${filas}
          </table></div>
          <div class="totales">
            ${subtotales}
            ${enCampana ? `<p class="total" data-en-campana><small>Artículos con descuento de campaña</small><span>${enCampana}</span></p>` : ''}
            <p class="total final"><small>${unidades} artículo${unidades === 1 ? '' : 's'}</small><b>Total a pagar: <span data-total>${
              unaMoneda ? importe(this.#totalEnMoneda(unaMoneda), unaMoneda) : importe(this.#totalCent())
            }</span></b></p>
            ${unaMoneda ? `<p class="total" data-equivale><small>Equivale a</small><span>${importe(this.#totalCent())}</span></p>` : ''}
          </div>
          <div class="row">
            <button type="button" data-a="vaciar" ${hay ? '' : 'disabled'}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${motivo ? 'disabled aria-describedby="motivo"' : ''}>Confirmar pedido</button>
          </div>
          ${motivo ? `<p id="motivo" class="motivo">${motivo}</p>` : ''}
          <p class="ok ${this.#flash.tipo === 'aviso' ? 'aviso' : ''}" role="status">${esc(this.#flash.texto)}${
            this.#deshacer ? ` <button type="button" class="enlace" data-a="deshacer">Deshacer</button>` : ''
          }</p>
        </div>
        ${resumen}
      </div></main>`;

    if (claveFoco) r.querySelector(claveFoco)?.focus();
  }
}

if (!customElements.get('ucjc-compra')) {
  customElements.define('ucjc-compra', UcjcCompra);
}
