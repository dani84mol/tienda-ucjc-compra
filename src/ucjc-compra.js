// Compra C: parte de Compra B (que a su vez parte de Compra A) y la mejora.
// Misma etiqueta <ucjc-compra> y los MISMOS tres contratos @1 firmados, sin añadir ni quitar campos:
//   escucha  ucjc:descubrimiento:anadir-al-carrito@1  { productoId, nombre, precio, cantidad }
//   escucha  ucjc:identidad:sesion-cambiada@1         { autenticado, usuario: { id, email, nombre? } | null }
//   emite    ucjc:compra:pedido-confirmado@1          { pedidoId, usuarioId, creadoEn, total, lineas[] }
// Todo lo demás (guardar el carrito, deshacer, resumen…) es interno a la pieza.

const EVT_ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const EVT_SES = 'ucjc:identidad:sesion-cambiada@1';
const EVT_PED = 'ucjc:compra:pedido-confirmado@1';
const EVT_PED_V2 = 'ucjc:compra:pedido-confirmado@2';

// pedido-confirmado@2 (con «moneda») está PROPUESTO, no firmado. El contrato dice:
// «Mientras esté propuesto, Compra sigue emitiendo el @1». Cuando se firme, poner true.
export const EMITIR_PEDIDO_V2 = false;

const CLAVE_GUARDADO = 'ucjc-compra:carrito';
const CLAVE_MONEDA = 'ucjc-compra:moneda';
const MAX_POR_LINEA = 99;

// ---------- Monedas ----------
// Los precios llegan siempre en euros (anadir-al-carrito@1). Se convierten con el tipo de cambio
// de referencia del BCE, sin comisión ni recargo: pagar en otra moneda no sale más caro.
// Fuente: Banque de France, paridades diarias del 16/11/2026.
export const MONEDAS = {
  EUR: { simbolo: '€', nombre: 'Euros', tasa: 1 },
  USD: { simbolo: '$', nombre: 'Dólares', tasa: 1.1014 },
  GBP: { simbolo: '£', nombre: 'Libras', tasa: 0.8345 },
};
const FECHA_TIPOS = '16/11/2026';

// ---------- Utilidades ----------
// Los importes se calculan en céntimos (enteros) para evitar errores como 0.1 + 0.2 = 0.30000000000000004
const aCent = (euros) => Math.round(euros * 100);
const deCent = (cent) => cent / 100;
const euros = (n) => `${n.toFixed(2).replace('.', ',')} €`;
// Precio unitario en euros → céntimos de la moneda elegida.
// Se redondea SIEMPRE hacia abajo: así la suma nunca supera la conversión exacta del total
// (redondeando al más cercano, 47,48 € salían 52,30 $ en vez de 52,29 $: 1 céntimo de más).
// El 1e-9 evita que un 2201,9999999 por coma flotante se quede en 2201.
const enMoneda = (precioEur, moneda) => Math.floor(aCent(precioEur) * MONEDAS[moneda].tasa + 1e-9);
const importe = (cent, moneda) => `${deCent(cent).toFixed(2).replace('.', ',')} ${MONEDAS[moneda].simbolo}`;

// Todo lo que viene de otra pieza se escapa antes de meterlo en innerHTML.
const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const hora = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

// Id de pedido legible y único: PED-20261123-7F3A9C
function nuevoPedidoId() {
  const fecha = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const azar = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2))
    .replaceAll('-', '')
    .slice(0, 6)
    .toUpperCase();
  return `PED-${fecha}-${azar}`;
}

// Valida el detail de anadir-al-carrito@1. Devuelve la línea limpia o null si no cumple el contrato.
function lineaValida(d) {
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

// Moneda elegida (se recuerda entre visitas). Si no hay nada guardado, euros.
const monedaGuardada = {
  leer() {
    try {
      const m = localStorage.getItem(CLAVE_MONEDA);
      return m in MONEDAS ? m : 'EUR';
    } catch {
      return 'EUR';
    }
  },
  escribir(m) {
    try {
      localStorage.setItem(CLAVE_MONEDA, m);
    } catch {
      /* sin almacenamiento */
    }
  },
};

// localStorage puede no existir o fallar (modo privado, iframes…): nunca debe romper la pieza.
const guardado = {
  leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '[]');
      return Array.isArray(datos) ? datos.map(lineaValida).filter(Boolean) : [];
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

const css = `
  :host { display:block; font:16px/1.5 system-ui, Arial, sans-serif; color:#1f2933; }
  * { box-sizing:border-box; }
  header { background:#1f3a63; color:#fff; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; }
  header h1 { margin:0; font-size:20px; display:flex; align-items:center; gap:.5rem; }
  .contador { font-size:13px; font-weight:700; background:#fff; color:#1f3a63; border-radius:999px; padding:1px 9px; }
  .chip { font-size:13px; padding:3px 10px; border-radius:999px; background:#e3f1e7; color:#14532d; font-weight:700; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .chip.sin { background:#ffe7c2; color:#6b3d00; }
  main { max-width:680px; margin:24px auto; padding:0 16px; }
  ol.pasos { display:flex; gap:6px; list-style:none; padding:0; margin:0 0 14px; font-size:13px; }
  ol.pasos li { flex:1; text-align:center; padding:4px; border-radius:6px; background:#eef1f6; color:#52606d; }
  ol.pasos li.hecho { background:#1f3a63; color:#fff; font-weight:700; }
  h2 { font-size:20px; margin:0 0 4px; }
  .sub { margin:0 0 16px; color:#52606d; font-size:14px; }
  .box { background:#fff; border:1px solid #cbd2d9; border-radius:10px; padding:16px; }
  .lista { max-height:280px; overflow-y:auto; border-bottom:1px solid #eee; }
  table { width:100%; border-collapse:collapse; }
  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#52606d; border-bottom:1px solid #d5d9e0; padding:6px 4px; }
  td { padding:8px 4px; border-bottom:1px solid #eee; vertical-align:middle; }
  .r { text-align:right; }
  .ud { display:block; font-size:12px; color:#616e7c; }
  .cant { display:inline-flex; align-items:center; gap:6px; }
  .cant output { min-width:1.5em; text-align:center; font-variant-numeric:tabular-nums; }
  .cant button { width:32px; height:32px; padding:0; border-radius:50%; font-size:17px; line-height:1; }
  .quitar { padding:3px 9px; font-size:13px; }
  .vacio { color:#52606d; font-style:italic; text-align:center; padding:18px 4px; }
  .total { display:flex; justify-content:space-between; align-items:baseline; font-size:18px; margin:14px 0; }
  .total small { font-size:14px; color:#52606d; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  button { font:inherit; font-size:15px; padding:8px 16px; border:1px solid #c4c4c4; border-radius:8px; background:#ececec; color:#1f2933; cursor:pointer; }
  button:hover:not(:disabled) { filter:brightness(.95); }
  button.main { background:#1f3a63; color:#fff; border-color:#1f3a63; margin-left:auto; }
  button.enlace { background:none; border:none; padding:0 4px; color:#1f3a63; text-decoration:underline; font-weight:700; }
  button:disabled { background:#e6e6e6; color:#6b6b6b; border-color:#d0d0d0; cursor:not-allowed; }
  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }
  .motivo { margin:10px 0 0; font-size:14px; color:#6b3d00; text-align:right; }
  .ok { margin:12px 0 0; font-size:14px; color:#1d6b2f; min-height:1.2em; }
  .ok.aviso { color:#6b3d00; }
  .resumen { margin-top:16px; border:1px solid #b7dfc3; background:#f0faf3; border-radius:10px; padding:14px 16px; }
  .resumen h3 { margin:0 0 6px; font-size:16px; color:#14532d; }
  .resumen p { margin:0 0 8px; font-size:14px; color:#3e4c59; }
  .resumen ul { margin:0 0 8px; padding-left:1.1rem; font-size:14px; }
  .resumen .total { font-size:16px; margin:0; }
  .moneda { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:0 0 12px; font-size:14px; }
  .moneda select { font:inherit; padding:6px 10px; border:1px solid #c4c4c4; border-radius:8px; background:#fff; }
  .moneda select:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }
  .moneda small { color:#52606d; }

  /* Móvil: cada línea del carrito pasa a ser una tarjeta */
  @media (max-width: 520px) {
    header { padding:12px 16px; }
    table, tbody, tr, td { display:block; width:100%; }
    tr.cabecera { display:none; }
    tr { border-bottom:1px solid #eee; padding:8px 0; display:grid; grid-template-columns:1fr auto; gap:4px 8px; }
    td { border:none; padding:2px 0; }
    td.r { text-align:left; }
    td.subtotal, td.acciones { text-align:right; }
    button.main { width:100%; margin-left:0; }
  }
`;

class UcjcCompra extends HTMLElement {
  #lineas = guardado.leer();
  #usuario = null; // { id, email, nombre? } de Identidad
  #flash = { texto: '', tipo: 'ok' };
  #deshacer = null; // líneas que había antes de «Vaciar»
  #ultimoPedido = null; // resumen del último pedido confirmado (solo para mostrar)
  #moneda = monedaGuardada.leer(); // 'EUR' | 'USD' | 'GBP'

  get #usuarioId() {
    return this.#usuario?.id ?? null;
  }

  // ---------- Escucha: anadir-al-carrito@1 ----------
  #onAdd = (e) => {
    const nueva = lineaValida(e.detail);
    if (!nueva) {
      console.warn(`[compra] ${EVT_ADD} con datos que no cumplen el contrato; se ignora`, e.detail);
      return;
    }
    const existente = this.#lineas.find((l) => l.productoId === nueva.productoId);
    const actual = existente ? existente.cantidad : 0;
    const total = Math.min(MAX_POR_LINEA, actual + nueva.cantidad);
    if (existente) existente.cantidad = total;
    else this.#lineas.push({ ...nueva, cantidad: total });

    this.#deshacer = null;
    this.#avisar(
      total < actual + nueva.cantidad
        ? `Máximo ${MAX_POR_LINEA} unidades de «${nueva.nombre}»`
        : `Añadido: ${nueva.nombre}`,
      total < actual + nueva.cantidad ? 'aviso' : 'ok',
    );
  };

  // ---------- Escucha: sesion-cambiada@1 ----------
  #onSes = (e) => {
    const d = e.detail || {};
    const antes = this.#usuarioId;
    const u = d.autenticado === true && d.usuario && d.usuario.id != null ? d.usuario : null;
    this.#usuario = u ? { id: String(u.id), email: u.email ?? '', nombre: u.nombre ?? '' } : null;
    // Al cambiar de usuario no se deja a la vista nada del anterior.
    if (antes !== this.#usuarioId) {
      this.#flash = { texto: '', tipo: 'ok' };
      this.#ultimoPedido = null;
    }
    this.#pintar();
  };

  connectedCallback() {
    // El shell puede quitar y volver a poner el elemento: attachShadow solo una vez.
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Un solo listener para todos los botones (no se pierde al repintar).
      this.shadowRoot.addEventListener('click', (e) => this.#clic(e));
      this.shadowRoot.addEventListener('change', (e) => {
        if (e.target.matches('select[data-moneda]')) this.#cambiarMoneda(e.target.value);
      });
    }
    window.addEventListener(EVT_ADD, this.#onAdd);
    window.addEventListener(EVT_SES, this.#onSes);
    this.#pintar();
  }

  disconnectedCallback() {
    window.removeEventListener(EVT_ADD, this.#onAdd);
    window.removeEventListener(EVT_SES, this.#onSes);
  }

  // ---------- Cálculos ----------
  // Total en céntimos de EURO (lo que manda el contrato @1).
  #totalCent() {
    return this.#lineas.reduce((s, l) => s + aCent(l.precio) * l.cantidad, 0);
  }

  // Total en céntimos de la moneda elegida: suma de las líneas ya convertidas,
  // así el total cuadra siempre con lo que se ve en cada línea.
  #totalMonedaCent(moneda = this.#moneda) {
    return this.#lineas.reduce((s, l) => s + enMoneda(l.precio, moneda) * l.cantidad, 0);
  }

  #cambiarMoneda(m) {
    if (!(m in MONEDAS) || m === this.#moneda) return;
    this.#moneda = m;
    monedaGuardada.escribir(m);
    this.#avisar(`Pagarás en ${MONEDAS[m].nombre.toLowerCase()}.`);
  }

  #unidades() {
    return this.#lineas.reduce((s, l) => s + l.cantidad, 0);
  }

  // Por qué no se puede confirmar (null si se puede).
  #motivo() {
    if (!this.#lineas.length) return 'El carrito está vacío: añade un producto del catálogo para poder confirmar.';
    if (!this.#usuarioId) return 'Inicia sesión en Identidad para confirmar el pedido.';
    return null;
  }

  // ---------- Emite: pedido-confirmado@1 ----------
  #confirmar() {
    if (this.#motivo()) return;
    // Exactamente los campos del contrato @1, ni uno más.
    const detail = {
      pedidoId: nuevoPedidoId(),
      usuarioId: this.#usuarioId,
      creadoEn: new Date().toISOString(),
      total: deCent(this.#totalCent()),
      lineas: this.#lineas.map(({ productoId, nombre, precio, cantidad }) => ({ productoId, nombre, precio, cantidad })),
    };
    // Lo que el usuario paga de verdad, en su moneda (para el resumen y para el @2).
    const moneda = this.#moneda;
    const pagado = {
      moneda,
      total: deCent(this.#totalMonedaCent(moneda)),
      lineas: detail.lineas.map((l) => ({ ...l, precio: deCent(enMoneda(l.precio, moneda)) })),
    };
    // Se vacía ANTES de emitir: un doble clic no puede mandar el mismo pedido dos veces.
    this.#lineas = [];
    this.#deshacer = null;
    this.#ultimoPedido = { ...detail, pagado };
    // @1 firmado: siempre en euros y con sus 5 campos exactos.
    window.dispatchEvent(new CustomEvent(EVT_PED, { detail }));
    // @2 (propuesto): mismo pedido en la moneda elegida. Apagado hasta que se firme.
    if (EMITIR_PEDIDO_V2) {
      const { pedidoId, usuarioId, creadoEn } = detail;
      window.dispatchEvent(new CustomEvent(EVT_PED_V2, {
        detail: { pedidoId, usuarioId, creadoEn, moneda, total: pagado.total, lineas: pagado.lineas },
      }));
    }
    this.#avisar(`Pedido ${detail.pedidoId} confirmado (${importe(aCent(pagado.total), moneda)})`);
  }

  #cambiar(productoId, delta) {
    const l = this.#lineas.find((x) => x.productoId === productoId);
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
  #pintar() {
    const r = this.shadowRoot;
    if (!r) return;

    // Al repintar se pierde el foco: se recuerda qué botón lo tenía para devolvérselo.
    const activo = r.activeElement;
    const claveFoco = activo?.dataset
      ? Object.entries(activo.dataset)
          .map(([k, v]) => `[data-${k}="${String(v).replace(/["\\]/g, '\\$&')}"]`)
          .join('')
      : '';

    const motivo = this.#motivo();
    const hay = this.#lineas.length > 0;
    const unidades = this.#unidades();
    const u = this.#usuario;
    const mon = this.#moneda;

    const filas = hay
      ? this.#lineas
          .map((l) => {
            const n = esc(l.nombre);
            const id = esc(l.productoId);
            return `<tr>
              <td>${n}<span class="ud">${importe(enMoneda(l.precio, mon), mon)} / ud.</span></td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${id}" aria-label="Quitar una unidad de ${n}">−</button>
                <output aria-label="Cantidad de ${n}">${l.cantidad}</output>
                <button type="button" data-mas="${id}" aria-label="Añadir una unidad de ${n}" ${l.cantidad >= MAX_POR_LINEA ? 'disabled' : ''}>+</button>
              </span></td>
              <td class="r subtotal">${importe(enMoneda(l.precio, mon) * l.cantidad, mon)}</td>
              <td class="r acciones"><button type="button" class="quitar" data-quitar="${id}" aria-label="Quitar ${n} del carrito">Quitar</button></td>
            </tr>`;
          })
          .join('')
      : '<tr><td colspan="4" class="vacio">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>';

    const p = this.#ultimoPedido;
    const resumen = p
      ? `<section class="resumen" aria-label="Último pedido confirmado">
          <h3>✅ Pedido confirmado</h3>
          <p><b>${esc(p.pedidoId)}</b> · ${hora(p.creadoEn)} · ${esc(u?.email || p.usuarioId)}</p>
          <ul>${p.pagado.lineas.map((l) => `<li>${l.cantidad} × ${esc(l.nombre)} — ${importe(aCent(l.precio) * l.cantidad, p.pagado.moneda)}</li>`).join('')}</ul>
          <p class="total"><span>Total pagado</span><b>${importe(aCent(p.pagado.total), p.pagado.moneda)}</b></p>
          ${p.pagado.moneda === 'EUR' ? '' : `<p><small>Equivale a ${euros(p.total)}.</small></p>`}
        </section>`
      : '';

    r.innerHTML = `
      <style>${css}</style>
      <header>
        <h1>UCJC Compra${unidades ? ` <span class="contador" aria-label="${unidades} artículos en el carrito">${unidades}</span>` : ''}</h1>
        <span class="chip ${u ? '' : 'sin'}" title="${u ? esc(u.email) : ''}">${u ? `Sesión: ${esc(u.nombre || u.email || u.id)}` : 'Sin sesión'}</span>
      </header>
      <main>
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${hay ? 'hecho' : ''}">1. Carrito</li>
          <li class="${u ? 'hecho' : ''}">2. Sesión</li>
          <li class="${motivo ? '' : 'hecho'}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Revisa los productos antes de confirmar el pedido. El carrito se guarda aunque recargues la página.</p>
        <div class="moneda">
          <label for="moneda">Pagar en</label>
          <select id="moneda" data-moneda>
            ${Object.entries(MONEDAS).map(([c, m]) => `<option value="${c}" ${c === mon ? 'selected' : ''}>${m.nombre} (${m.simbolo})</option>`).join('')}
          </select>
          ${mon === 'EUR' ? '' : `<small>1 € = ${String(MONEDAS[mon].tasa).replace('.', ',')} ${MONEDAS[mon].simbolo} · tipo de referencia BCE del ${FECHA_TIPOS}, sin comisión</small>`}
        </div>
        <div class="box">
          <div class="lista"><table>
            <tr class="cabecera"><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${filas}
          </table></div>
          <p class="total"><small>${unidades} artículo${unidades === 1 ? '' : 's'}</small><b>Total: <span data-total>${importe(this.#totalMonedaCent(), mon)}</span></b></p>
          ${mon !== 'EUR' && hay ? `<p class="sub" data-equivale>Equivale a ${euros(deCent(this.#totalCent()))}</p>` : ''}
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
      </main>`;

    if (claveFoco) r.querySelector(claveFoco)?.focus();
  }
}

if (!customElements.get('ucjc-compra')) {
  customElements.define('ucjc-compra', UcjcCompra);
}
