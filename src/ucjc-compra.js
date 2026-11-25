const EVT_ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const EVT_SES = 'ucjc:identidad:sesion-cambiada@1';
const EVT_PED = 'ucjc:compra:pedido-confirmado@1';
const EVT_PED_V2 = 'ucjc:compra:pedido-confirmado@2';

export const EMITIR_PEDIDO_V2 = false;

const CLAVE_GUARDADO = 'ucjc-compra:carrito';
const MAX_POR_LINEA = 99;

export const MONEDAS = {
  EUR: { simbolo: '€', nombre: 'Euros', tasa: 1 },
  USD: { simbolo: '$', nombre: 'Dólares', tasa: 1.1014 },
  GBP: { simbolo: '£', nombre: 'Libras', tasa: 0.8345 },
};

const aCent = (euros) => Math.round(euros * 100);
const deCent = (cent) => cent / 100;
const euros = (n) => `${n.toFixed(2).replace('.', ',')} €`;

const enMoneda = (precioEur, moneda) => Math.floor(aCent(precioEur) * MONEDAS[moneda].tasa + 1e-9);
const importe = (cent, moneda) => `${deCent(cent).toFixed(2).replace('.', ',')} ${MONEDAS[moneda].simbolo}`;

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

function lineaValida(d, permitirMoneda = false) {
  if (!d || typeof d !== 'object') return null;
  const productoId = d.productoId == null ? '' : String(d.productoId).trim();
  const nombre = typeof d.nombre === 'string' ? d.nombre.trim() : '';
  const precio = Number(d.precio);
  const cantidad = Number(d.cantidad);
  if (!productoId || !nombre) return null;
  if (!Number.isFinite(precio) || precio < 0) return null;
  if (!Number.isInteger(cantidad) || cantidad < 1) return null;

  const moneda = permitirMoneda && typeof d.moneda === 'string' && d.moneda in MONEDAS
    ? d.moneda
    : 'EUR';

  return { productoId, nombre, precio, cantidad, moneda };
}

const guardado = {
  leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '[]');
      return Array.isArray(datos) ? datos.map((d) => lineaValida(d, true)).filter(Boolean) : [];
    } catch {
      return [];
    }
  },
  escribir(lineas) {
    try {
      localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(lineas));
    } catch {}
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
  .lista { max-height:320px; overflow-y:auto; border-bottom:1px solid #eee; }
  table { width:100%; border-collapse:collapse; }
  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#52606d; border-bottom:1px solid #d5d9e0; padding:6px 4px; z-index:1; }
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
  .totales { margin:14px 0; }
  .totales .total { margin:6px 0; }
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
  .selector-moneda { display:flex; align-items:center; gap:5px; margin-top:5px; font-size:12px; color:#52606d; }
  .selector-moneda select { font:inherit; font-size:12px; padding:3px 6px; border:1px solid #c4c4c4; border-radius:6px; background:#fff; color:#1f2933; }
  .selector-moneda select:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }

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
  #usuario = null;
  #flash = { texto: '', tipo: 'ok' };
  #deshacer = null;
  #ultimoPedido = null;

  get #usuarioId() {
    return this.#usuario?.id ?? null;
  }

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

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.addEventListener('click', (e) => this.#clic(e));
      this.shadowRoot.addEventListener('change', (e) => {
        if (e.target.matches('select[data-moneda]')) {
          this.#cambiarMoneda(e.target.dataset.productoId, e.target.value);
        }
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

  #totalCent() {
    return this.#lineas.reduce((s, l) => s + aCent(l.precio) * l.cantidad, 0);
  }

  #totalMonedaCent(moneda) {
    return this.#lineas.reduce(
      (s, l) => s + (l.moneda === moneda ? enMoneda(l.precio, moneda) * l.cantidad : 0),
      0,
    );
  }

  #cambiarMoneda(productoId, m) {
    if (!(m in MONEDAS)) return;
    const linea = this.#lineas.find((l) => l.productoId === productoId);
    if (!linea || linea.moneda === m) return;
    linea.moneda = m;
    this.#avisar(`«${linea.nombre}» se mostrará en ${MONEDAS[m].nombre.toLowerCase()}.`);
  }

  #unidades() {
    return this.#lineas.reduce((s, l) => s + l.cantidad, 0);
  }

  #motivo() {
    if (!this.#lineas.length) return 'El carrito está vacío: añade un producto del catálogo para poder confirmar.';
    if (!this.#usuarioId) return 'Inicia sesión en Identidad para confirmar el pedido.';
    return null;
  }

  #confirmar() {
    if (this.#motivo()) return;
    const detail = {
      pedidoId: nuevoPedidoId(),
      usuarioId: this.#usuarioId,
      creadoEn: new Date().toISOString(),
      total: deCent(this.#totalCent()),
      lineas: this.#lineas.map(({ productoId, nombre, precio, cantidad }) => ({ productoId, nombre, precio, cantidad })),
    };
    const pagado = {
      lineas: this.#lineas.map((l) => ({
        ...l,
        precio: deCent(enMoneda(l.precio, l.moneda)),
      })),
      totales: Object.fromEntries(
        Object.keys(MONEDAS)
          .map((moneda) => [moneda, this.#totalMonedaCent(moneda)])
          .filter(([, total]) => total > 0),
      ),
    };
    this.#lineas = [];
    this.#deshacer = null;
    this.#ultimoPedido = { ...detail, pagado };
    window.dispatchEvent(new CustomEvent(EVT_PED, { detail }));
    if (EMITIR_PEDIDO_V2) {
      const { pedidoId, usuarioId, creadoEn } = detail;
      window.dispatchEvent(new CustomEvent(EVT_PED_V2, {
        detail: { pedidoId, usuarioId, creadoEn, moneda: 'EUR', total: detail.total, lineas: detail.lineas },
      }));
    }
    this.#avisar(`Pedido ${detail.pedidoId} confirmado`);
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

  #pintar() {
    const r = this.shadowRoot;
    if (!r) return;

    const activo = r.activeElement;
    const claveFoco = activo?.dataset
      ? Object.entries(activo.dataset)
          .map(([k, v]) => {
            const attr = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            return `[data-${attr}="${String(v).replace(/["\\]/g, '\\$&')}"]`;
          })
          .join('')
      : '';

    const motivo = this.#motivo();
    const hay = this.#lineas.length > 0;
    const unidades = this.#unidades();
    const u = this.#usuario;

    const filas = hay
      ? this.#lineas
          .map((l) => {
            const n = esc(l.nombre);
            const id = esc(l.productoId);
            const mon = l.moneda;
            return `<tr>
              <td>
                ${n}
                <span class="ud">${importe(enMoneda(l.precio, mon), mon)} / ud.</span>
                <label class="selector-moneda">
                  <span>Moneda:</span>
                  <select data-moneda data-producto-id="${id}" aria-label="Moneda para ${n}">
                    ${Object.entries(MONEDAS).map(([c, m]) => `<option value="${c}" ${c === mon ? 'selected' : ''}>${m.nombre} (${m.simbolo})</option>`).join('')}
                  </select>
                </label>
              </td>
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

    const totalesHTML = hay
      ? Object.keys(MONEDAS)
          .map((moneda) => ({
            moneda,
            total: this.#totalMonedaCent(moneda),
          }))
          .filter((dato) => dato.total > 0)
          .map((dato) => `
            <p class="total">
              <small>Total en ${MONEDAS[dato.moneda].nombre}</small>
              <b>${importe(dato.total, dato.moneda)}</b>
            </p>
          `)
          .join('')
      : `<p class="total"><small>Total</small><b>${importe(0, 'EUR')}</b></p>`;

    const p = this.#ultimoPedido;
    const resumen = p
      ? `<section class="resumen" aria-label="Último pedido confirmado">
          <h3>✅ Pedido confirmado</h3>
          <p><b>${esc(p.pedidoId)}</b> · ${hora(p.creadoEn)} · ${esc(u?.email || p.usuarioId)}</p>
          <ul>${p.pagado.lineas.map((l) => `<li>${l.cantidad} × ${esc(l.nombre)} — ${importe(aCent(l.precio) * l.cantidad, l.moneda)}</li>`).join('')}</ul>
          ${Object.entries(p.pagado.totales).map(([moneda, total]) => `
            <p class="total">
              <span>Total en ${MONEDAS[moneda].nombre}</span>
              <b>${importe(total, moneda)}</b>
            </p>
          `).join('')}
          ${p.pagado.lineas.some((l) => l.moneda !== 'EUR') ? `<p><small>Total equivalente en euros: ${euros(p.total)}.</small></p>` : ''}
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
        <div class="box">
          <div class="lista"><table>
            <tr class="cabecera"><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${filas}
          </table></div>
          <div class="totales">
            ${totalesHTML}
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
      </main>`;

    if (claveFoco) r.querySelector(claveFoco)?.focus();
  }
}

if (!customElements.get('ucjc-compra')) {
  customElements.define('ucjc-compra', UcjcCompra);
}