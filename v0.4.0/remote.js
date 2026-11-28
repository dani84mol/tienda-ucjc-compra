// src/ucjc-compra.js
var e = "ucjc:descubrimiento:anadir-al-carrito@1", t = "ucjc:descubrimiento:campana-cambiada@1", n = "ucjc:descubrimiento:moneda-cambiada@1", r = "ucjc-compra:carrito", i = {
	EUR: {
		simbolo: "€",
		nombre: "euros",
		tasa: 1
	},
	USD: {
		simbolo: "$",
		nombre: "dólares",
		tasa: 1.1014
	},
	GBP: {
		simbolo: "£",
		nombre: "libras",
		tasa: .8345
	}
}, a = (e) => Math.round(e * 100), o = (e) => e / 100, s = (e, t) => Math.floor(a(e) * i[t].tasa + 1e-9), c = (e, t = "EUR") => `${o(e).toFixed(2).replace(".", ",")} ${i[t].simbolo}`, l = (e) => String(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), u = (e) => new Date(e).toLocaleTimeString("es-ES", {
	hour: "2-digit",
	minute: "2-digit"
});
function d() {
	return `PED-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}
var f = () => globalThis.window?.ucjcCampus?.version === "1" ? window.ucjcCampus : null;
function p(e, t) {
	let n = f();
	return n ? n.escuchar(e, t) : (window.addEventListener(e, t), () => window.removeEventListener(e, t));
}
function m(e, t) {
	let n = f();
	n ? n.emitir(e, t) : window.dispatchEvent(new CustomEvent(e, { detail: t }));
}
var h = (e) => `${e.productoId}|${e.moneda}|${e.campana ?? ""}`;
function g(e) {
	if (!e || typeof e != "object") return null;
	let t = e.productoId == null ? "" : String(e.productoId).trim(), n = typeof e.nombre == "string" ? e.nombre.trim() : "", r = Number(e.precio), i = Number(e.cantidad);
	return !t || !n || !Number.isFinite(r) || r < 0 || !Number.isInteger(i) || i < 1 ? null : {
		productoId: t,
		nombre: n,
		precio: r,
		cantidad: i
	};
}
function _(e) {
	let t = g(e);
	if (!t) return null;
	let n = e.moneda in i ? e.moneda : "EUR", r = typeof e.campana == "string" && e.campana ? e.campana : null, a = r && typeof e.etiqueta == "string" && e.etiqueta ? e.etiqueta : r;
	return {
		...t,
		moneda: n,
		campana: r,
		etiqueta: a
	};
}
var v = {
	leer() {
		try {
			let e = JSON.parse(localStorage.getItem(r) || "[]");
			return Array.isArray(e) ? e.map(_).filter(Boolean) : [];
		} catch {
			return [];
		}
	},
	escribir(e) {
		try {
			localStorage.setItem(r, JSON.stringify(e));
		} catch {}
	}
}, y = "\n  :host {\n    display: block;\n    font-family: var(--ucjc-font-sans, \"Segoe UI\", sans-serif);\n    font-size: 1rem;\n    line-height: 1.5;\n    color: var(--ucjc-ink, #1a242c);\n  }\n  * { box-sizing: border-box; }\n\n  header {\n    background: var(--ucjc-brand, #0b3d4a);\n    color: var(--ucjc-panel, #fbfcfb);\n    padding: var(--ucjc-space, 0.75rem) var(--ucjc-space-lg, 1.25rem);\n    display: flex; justify-content: space-between; align-items: center;\n    gap: var(--ucjc-space, 0.75rem); flex-wrap: wrap;\n  }\n  header h1 {\n    margin: 0; font-size: 1.25rem;\n    font-family: var(--ucjc-font-display, Georgia, serif);\n    display: flex; align-items: center; gap: 0.5rem;\n  }\n  .contador {\n    font-family: var(--ucjc-font-sans, \"Segoe UI\", sans-serif);\n    font-size: 0.8rem; font-weight: 700; padding: 0 0.55rem; border-radius: 999px;\n    background: var(--ucjc-panel, #fbfcfb); color: var(--ucjc-brand, #0b3d4a);\n  }\n  .chip {\n    font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 999px;\n    background: var(--ucjc-panel, #fbfcfb); color: var(--ucjc-leaf, #2f6f4e);\n    max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n  }\n  .chip.sin { color: var(--ucjc-warn, #8a3a3a); }\n\n  .campana {\n    display: flex; align-items: center; gap: var(--ucjc-space, 0.75rem); flex-wrap: wrap;\n    padding: var(--ucjc-space, 0.75rem) var(--ucjc-space-lg, 1.25rem);\n    background: var(--ucjc-brand-bright, #146b7a); color: var(--ucjc-panel, #fbfcfb);\n    font-weight: 700;\n  }\n  .campana small { font-weight: 400; }\n\n  main { max-width: var(--ucjc-max, 72rem); margin: var(--ucjc-space-lg, 1.25rem) auto; padding: 0 var(--ucjc-space, 0.75rem); }\n  .contenido { max-width: 44rem; margin: 0 auto; }\n\n  ol.pasos { display: flex; gap: 0.4rem; list-style: none; padding: 0; margin: 0 0 var(--ucjc-space, 0.75rem); font-size: 0.8rem; }\n  ol.pasos li {\n    flex: 1; text-align: center; padding: 0.25rem; border-radius: var(--ucjc-radius, 6px);\n    background: var(--ucjc-mist, #e6ece8); color: var(--ucjc-muted, #5a6a76);\n  }\n  ol.pasos li.hecho { background: var(--ucjc-brand, #0b3d4a); color: var(--ucjc-panel, #fbfcfb); font-weight: 700; }\n\n  h2 { font-family: var(--ucjc-font-display, Georgia, serif); font-size: 1.25rem; margin: 0 0 0.25rem; }\n  .sub { margin: 0 0 var(--ucjc-space, 0.75rem); color: var(--ucjc-muted, #5a6a76); font-size: 0.9rem; }\n\n  .box {\n    background: var(--ucjc-panel, #fbfcfb);\n    border: 1px solid var(--ucjc-edge, #c9d3cd);\n    border-radius: var(--ucjc-radius, 6px);\n    padding: var(--ucjc-space-lg, 1.25rem);\n  }\n  .lista { max-height: 20rem; overflow-y: auto; border-bottom: 1px solid var(--ucjc-mist, #e6ece8); }\n  table { width: 100%; border-collapse: collapse; }\n  th {\n    position: sticky; top: 0; z-index: 1; text-align: left; font-size: 0.8rem; padding: 0.4rem 0.25rem;\n    background: var(--ucjc-panel, #fbfcfb); color: var(--ucjc-muted, #5a6a76);\n    border-bottom: 1px solid var(--ucjc-edge, #c9d3cd);\n  }\n  td { padding: 0.5rem 0.25rem; border-bottom: 1px solid var(--ucjc-mist, #e6ece8); vertical-align: middle; }\n  .r { text-align: right; }\n  .ud { display: block; font-size: 0.75rem; color: var(--ucjc-muted, #5a6a76); }\n  .etiquetas { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.2rem; }\n  .etiqueta {\n    font-size: 0.7rem; font-weight: 700; padding: 0.05rem 0.45rem; border-radius: 999px;\n    border: 1px solid var(--ucjc-edge, #c9d3cd); color: var(--ucjc-muted, #5a6a76);\n  }\n  .etiqueta.bf { background: var(--ucjc-brand-bright, #146b7a); border-color: var(--ucjc-brand-bright, #146b7a); color: var(--ucjc-panel, #fbfcfb); }\n\n  .cant { display: inline-flex; align-items: center; gap: 0.4rem; }\n  .cant output { min-width: 1.5em; text-align: center; font-variant-numeric: tabular-nums; }\n  .cant button { width: 2rem; height: 2rem; padding: 0; border-radius: 50%; font-size: 1.05rem; line-height: 1; }\n  .quitar { padding: 0.2rem 0.55rem; font-size: 0.8rem; }\n  .vacio { color: var(--ucjc-muted, #5a6a76); font-style: italic; text-align: center; padding: var(--ucjc-space-lg, 1.25rem) 0.25rem; }\n\n  .totales { margin: var(--ucjc-space, 0.75rem) 0; }\n  .total { display: flex; justify-content: space-between; align-items: baseline; margin: 0.3rem 0; font-size: 0.95rem; }\n  .total small { color: var(--ucjc-muted, #5a6a76); font-size: 0.85rem; }\n  .total.final { font-size: 1.15rem; padding-top: 0.4rem; border-top: 1px solid var(--ucjc-mist, #e6ece8); }\n\n  .row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }\n  button {\n    font: inherit; font-size: 0.95rem; cursor: pointer;\n    padding: 0.5rem var(--ucjc-space, 0.75rem);\n    border: 1px solid var(--ucjc-edge, #c9d3cd); border-radius: var(--ucjc-radius, 6px);\n    background: var(--ucjc-mist, #e6ece8); color: var(--ucjc-ink, #1a242c);\n    transition: background-color 0.15s var(--ucjc-ease, ease);\n  }\n  button:hover:not(:disabled) { background: var(--ucjc-fog, #f3f6f4); }\n  button.main {\n    margin-left: auto; font-weight: 700;\n    background: var(--ucjc-brand-bright, #146b7a); border-color: var(--ucjc-brand-bright, #146b7a);\n    color: var(--ucjc-panel, #fbfcfb);\n  }\n  button.main:hover:not(:disabled) { background: var(--ucjc-brand, #0b3d4a); }\n  button.enlace { background: none; border: none; padding: 0 0.25rem; color: var(--ucjc-brand-bright, #146b7a); text-decoration: underline; font-weight: 700; }\n  button:disabled { cursor: not-allowed; opacity: 0.55; }\n  button:focus-visible { outline: 3px solid var(--ucjc-brand-bright, #146b7a); outline-offset: 2px; }\n\n  .motivo { margin: var(--ucjc-space, 0.75rem) 0 0; font-size: 0.9rem; color: var(--ucjc-warn, #8a3a3a); text-align: right; }\n  .ok { margin: var(--ucjc-space, 0.75rem) 0 0; font-size: 0.9rem; color: var(--ucjc-leaf, #2f6f4e); min-height: 1.2em; }\n  .ok.aviso { color: var(--ucjc-warn, #8a3a3a); }\n\n  .resumen {\n    margin-top: var(--ucjc-space-lg, 1.25rem); padding: var(--ucjc-space, 0.75rem) var(--ucjc-space-lg, 1.25rem);\n    background: var(--ucjc-fog, #f3f6f4);\n    border: 1px solid var(--ucjc-leaf, #2f6f4e); border-radius: var(--ucjc-radius, 6px);\n  }\n  .resumen h3 { margin: 0 0 0.4rem; font-family: var(--ucjc-font-display, Georgia, serif); font-size: 1rem; color: var(--ucjc-leaf, #2f6f4e); }\n  .resumen p { margin: 0 0 0.5rem; font-size: 0.9rem; color: var(--ucjc-muted, #5a6a76); }\n  .resumen ul { margin: 0 0 0.5rem; padding-left: 1.1rem; font-size: 0.9rem; }\n\n  @media (max-width: 520px) {\n    table, tbody, tr, td { display: block; width: 100%; }\n    tr.cabecera { display: none; }\n    tr { display: grid; grid-template-columns: 1fr auto; gap: 0.25rem 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid var(--ucjc-mist, #e6ece8); }\n    td { border: none; padding: 0.1rem 0; }\n    td.r { text-align: left; }\n    td.subtotal, td.acciones { text-align: right; }\n    button.main { width: 100%; margin-left: 0; }\n  }\n", b = class extends HTMLElement {
	#e = v.leer();
	#t = null;
	#n = null;
	#r = "EUR";
	#i = {
		texto: "",
		tipo: "ok"
	};
	#a = null;
	#o = null;
	#s = [];
	get #c() {
		return this.#t?.id ?? null;
	}
	#l = (t) => {
		let n = g(t.detail);
		if (!n) {
			console.warn(`[compra] ${e} con datos que no cumplen el contrato; se ignora`, t.detail);
			return;
		}
		let r = {
			...n,
			moneda: this.#r,
			campana: this.#n?.codigo ?? null,
			etiqueta: this.#n?.etiqueta ?? null
		}, i = this.#e.find((e) => h(e) === h(r)), a = i ? i.cantidad : 0, o = Math.min(99, a + r.cantidad);
		i ? i.cantidad = o : this.#e.push({
			...r,
			cantidad: o
		}), this.#a = null;
		let s = o < a + r.cantidad;
		this.#S(s ? `Máximo 99 unidades de «${r.nombre}»` : `Añadido: ${r.nombre}${r.etiqueta ? ` (${r.etiqueta})` : ""}`, s ? "aviso" : "ok");
	};
	#u = (e) => {
		let t = e.detail || {}, n = this.#c, r = t.autenticado === !0 && t.usuario && t.usuario.id != null ? t.usuario : null;
		this.#t = r ? {
			id: String(r.id),
			email: r.email ?? "",
			nombre: r.nombre ?? ""
		} : null, n !== this.#c && (this.#i = {
			texto: "",
			tipo: "ok"
		}, this.#o = null), this.#T();
	};
	#d = (e) => {
		let n = e.detail || {};
		if (typeof n.activa != "boolean" || typeof n.codigo != "string" || !n.codigo) {
			console.warn(`[compra] ${t} con datos que no cumplen el contrato; se ignora`, n);
			return;
		}
		let r = typeof n.etiqueta == "string" && n.etiqueta ? n.etiqueta : n.codigo, i = this.#n?.codigo ?? null;
		this.#n = n.activa ? {
			codigo: n.codigo,
			etiqueta: r
		} : null, i === (this.#n?.codigo ?? null) ? this.#T() : this.#S(n.activa ? `${r} activado: lo que añadas ahora lleva su descuento.` : `${r} ha terminado.`);
	};
	#f = (e) => {
		let t = e.detail?.moneda;
		t in i ? t !== this.#r && (this.#r = t, this.#T()) : console.warn(`[compra] ${n} con una moneda que no conocemos; se ignora`, e.detail);
	};
	connectedCallback() {
		f() || console.warn("[compra] sin campus: se usan los valores de reserva y window.dispatchEvent"), this.shadowRoot || (this.attachShadow({ mode: "open" }), this.shadowRoot.addEventListener("click", (e) => this.#C(e))), this.#s.forEach((e) => e()), this.#s = [
			p(e, this.#l),
			p("ucjc:identidad:sesion-cambiada@1", this.#u),
			p(t, this.#d),
			p(n, this.#f)
		], this.#T();
	}
	disconnectedCallback() {
		this.#s.forEach((e) => e()), this.#s = [];
	}
	#p(e = this.#e) {
		return e.reduce((e, t) => e + a(t.precio) * t.cantidad, 0);
	}
	#m(e, t = this.#e) {
		return t.filter((t) => t.moneda === e).reduce((t, n) => t + s(n.precio, e) * n.cantidad, 0);
	}
	#h(e = this.#e) {
		return Object.keys(i).filter((t) => e.some((e) => e.moneda === t));
	}
	#g() {
		return this.#e.reduce((e, t) => e + t.cantidad, 0);
	}
	#_() {
		return this.#e.length ? this.#c ? null : "Inicia sesión en Identidad para confirmar el pedido." : "El carrito está vacío: añade un producto del catálogo para poder confirmar.";
	}
	#v() {
		if (this.#_()) return;
		let e = this.#e.map((e) => ({ ...e })), t = {
			pedidoId: d(),
			usuarioId: this.#c,
			creadoEn: (/* @__PURE__ */ new Date()).toISOString(),
			total: o(this.#p(e)),
			lineas: e.map(({ productoId: e, nombre: t, precio: n, cantidad: r }) => ({
				productoId: e,
				nombre: t,
				precio: n,
				cantidad: r
			}))
		};
		this.#e = [], this.#a = null, this.#o = {
			...t,
			detalle: e
		}, m("ucjc:compra:pedido-confirmado@1", t), this.#S(`Pedido ${t.pedidoId} confirmado (${c(a(t.total))})`);
	}
	#y(e, t) {
		let n = this.#e.find((t) => h(t) === e);
		n && (t > 0 && n.cantidad >= 99 ? this.#S(`Máximo 99 unidades de «${n.nombre}»`, "aviso") : (n.cantidad += t, n.cantidad < 1 ? (this.#e = this.#e.filter((e) => e !== n), this.#S(`Quitado: ${n.nombre}`)) : this.#S("")));
	}
	#b() {
		this.#e.length && (this.#a = this.#e.map((e) => ({ ...e })), this.#e = [], this.#S("Carrito vaciado."));
	}
	#x() {
		this.#a && (this.#e = this.#a, this.#a = null, this.#S("Carrito recuperado."));
	}
	#S(e, t = "ok") {
		this.#i = {
			texto: e,
			tipo: t
		}, v.escribir(this.#e), this.#T();
	}
	#C(e) {
		let t = e.target.closest("button");
		t && !t.disabled && (t.dataset.a === "ok" ? this.#v() : t.dataset.a === "vaciar" ? this.#b() : t.dataset.a === "deshacer" ? this.#x() : t.dataset.mas ? this.#y(t.dataset.mas, 1) : t.dataset.menos ? this.#y(t.dataset.menos, -1) : t.dataset.quitar && this.#y(t.dataset.quitar, -Infinity));
	}
	#w(e) {
		let t = [];
		return e.campana && t.push(`<span class="etiqueta bf" data-campana="${l(e.campana)}">🏷️ ${l(e.etiqueta || e.campana)}</span>`), e.moneda !== "EUR" && t.push(`<span class="etiqueta" data-moneda-linea="${e.moneda}">${e.moneda}</span>`), t.length ? `<span class="etiquetas">${t.join("")}</span>` : "";
	}
	#T() {
		let e = this.shadowRoot;
		if (!e) return;
		let t = e.activeElement, n = t?.dataset ? Object.entries(t.dataset).map(([e, t]) => `[data-${e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}="${String(t).replace(/["\\]/g, "\\$&")}"]`).join("") : "", r = this.#_(), o = this.#e.length > 0, d = this.#g(), f = this.#t, p = this.#n, m = o ? this.#e.map((e) => {
			let t = l(e.nombre), n = l(h(e)), r = s(e.precio, e.moneda);
			return `<tr data-linea="${n}">
              <td>${t}
                <span class="ud">${c(r, e.moneda)} / ud.${e.moneda === "EUR" ? "" : ` · ${c(a(e.precio))}`}</span>
                ${this.#w(e)}
              </td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${n}" aria-label="Quitar una unidad de ${t}">−</button>
                <output aria-label="Cantidad de ${t}">${e.cantidad}</output>
                <button type="button" data-mas="${n}" aria-label="Añadir una unidad de ${t}" ${e.cantidad >= 99 ? "disabled" : ""}>+</button>
              </span></td>
              <td class="r subtotal">${c(r * e.cantidad, e.moneda)}</td>
              <td class="r acciones"><button type="button" class="quitar" data-quitar="${n}" aria-label="Quitar ${t} del carrito">Quitar</button></td>
            </tr>`;
		}).join("") : "<tr><td colspan=\"4\" class=\"vacio\">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>", g = this.#h(), _ = g.length === 1 && g[0] !== "EUR" ? g[0] : null, v = o && g.length > 1 ? g.map((e) => `<p class="total" data-subtotal="${e}"><small>Productos en ${i[e].nombre}</small><span>${c(this.#m(e), e)}</span></p>`).join("") : "", b = this.#e.filter((e) => e.campana).reduce((e, t) => e + t.cantidad, 0), x = this.#o, S = x ? `<section class="resumen" aria-label="Último pedido confirmado">
          <h3>✅ Pedido confirmado</h3>
          <p><b>${l(x.pedidoId)}</b> · ${u(x.creadoEn)} · ${l(f?.email || x.usuarioId)}</p>
          <ul>${x.detalle.map((e) => `<li>${e.cantidad} × ${l(e.nombre)}${e.campana ? ` <b>(${l(e.etiqueta || e.campana)})</b>` : ""} — ${c(s(e.precio, e.moneda) * e.cantidad, e.moneda)}</li>`).join("")}</ul>
          <p class="total final"><span>Total pagado</span><b>${c(a(x.total))}</b></p>
        </section>` : "";
		e.innerHTML = `
      <style>${y}</style>
      <header>
        <h1>UCJC Compra${d ? ` <span class="contador" aria-label="${d} artículos en el carrito">${d}</span>` : ""}</h1>
        <span class="chip ${f ? "" : "sin"}" title="${f ? l(f.email) : ""}">${f ? `Sesión: ${l(f.nombre || f.email || f.id)}` : "Sin sesión"}</span>
      </header>
      ${p ? `<div class="campana" role="status" data-campana-activa="${l(p.codigo)}">🏷️ ${l(p.etiqueta)} activo <small>Los productos que añadas ahora llevan el descuento de la campaña.</small></div>` : ""}
      <main><div class="contenido">
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${o ? "hecho" : ""}">1. Carrito</li>
          <li class="${f ? "hecho" : ""}">2. Sesión</li>
          <li class="${r ? "" : "hecho"}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Precios y moneda según el catálogo. Un mismo producto en otra moneda o en campaña aparece en una línea aparte.</p>
        <div class="box">
          <div class="lista"><table>
            <tr class="cabecera"><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${m}
          </table></div>
          <div class="totales">
            ${v}
            ${b ? `<p class="total" data-en-campana><small>Artículos con descuento de campaña</small><span>${b}</span></p>` : ""}
            <p class="total final"><small>${d} artículo${d === 1 ? "" : "s"}</small><b>Total a pagar: <span data-total>${_ ? c(this.#m(_), _) : c(this.#p())}</span></b></p>
            ${_ ? `<p class="total" data-equivale><small>Equivale a</small><span>${c(this.#p())}</span></p>` : ""}
          </div>
          <div class="row">
            <button type="button" data-a="vaciar" ${o ? "" : "disabled"}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${r ? "disabled aria-describedby=\"motivo\"" : ""}>Confirmar pedido</button>
          </div>
          ${r ? `<p id="motivo" class="motivo">${r}</p>` : ""}
          <p class="ok ${this.#i.tipo === "aviso" ? "aviso" : ""}" role="status">${l(this.#i.texto)}${this.#a ? " <button type=\"button\" class=\"enlace\" data-a=\"deshacer\">Deshacer</button>" : ""}</p>
        </div>
        ${S}
      </div></main>`, n && e.querySelector(n)?.focus();
	}
};
customElements.get("ucjc-compra") || customElements.define("ucjc-compra", b);
// src/main.js
var x = {
	nombre: "compra",
	version: "0.4.0"
};
export { x as default };
