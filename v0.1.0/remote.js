// src/ucjc-compra.js
var e = "ucjc:descubrimiento:anadir-al-carrito@1", t = "ucjc:identidad:sesion-cambiada@1", n = "ucjc-compra:carrito", r = (e) => Math.round(e * 100), i = (e) => e / 100, a = (e) => `${e.toFixed(2).replace(".", ",")} €`, o = (e) => String(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), s = (e) => new Date(e).toLocaleTimeString("es-ES", {
	hour: "2-digit",
	minute: "2-digit"
});
function c() {
	return `PED-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}
function l(e) {
	if (!e || typeof e != "object") return null;
	let t = e.productoId == null ? "" : String(e.productoId).trim(), n = typeof e.nombre == "string" ? e.nombre.trim() : "", r = Number(e.precio), i = Number(e.cantidad);
	return !t || !n || !Number.isFinite(r) || r < 0 || !Number.isInteger(i) || i < 1 ? null : {
		productoId: t,
		nombre: n,
		precio: r,
		cantidad: i
	};
}
var u = {
	leer() {
		try {
			let e = JSON.parse(localStorage.getItem(n) || "[]");
			return Array.isArray(e) ? e.map(l).filter(Boolean) : [];
		} catch {
			return [];
		}
	},
	escribir(e) {
		try {
			localStorage.setItem(n, JSON.stringify(e));
		} catch {}
	}
}, d = "\n  :host { display:block; font:16px/1.5 system-ui, Arial, sans-serif; color:#1f2933; }\n  * { box-sizing:border-box; }\n  header { background:#1f3a63; color:#fff; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; }\n  header h1 { margin:0; font-size:20px; display:flex; align-items:center; gap:.5rem; }\n  .contador { font-size:13px; font-weight:700; background:#fff; color:#1f3a63; border-radius:999px; padding:1px 9px; }\n  .chip { font-size:13px; padding:3px 10px; border-radius:999px; background:#e3f1e7; color:#14532d; font-weight:700; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n  .chip.sin { background:#ffe7c2; color:#6b3d00; }\n  main { max-width:680px; margin:24px auto; padding:0 16px; }\n  ol.pasos { display:flex; gap:6px; list-style:none; padding:0; margin:0 0 14px; font-size:13px; }\n  ol.pasos li { flex:1; text-align:center; padding:4px; border-radius:6px; background:#eef1f6; color:#52606d; }\n  ol.pasos li.hecho { background:#1f3a63; color:#fff; font-weight:700; }\n  h2 { font-size:20px; margin:0 0 4px; }\n  .sub { margin:0 0 16px; color:#52606d; font-size:14px; }\n  .box { background:#fff; border:1px solid #cbd2d9; border-radius:10px; padding:16px; }\n  .lista { max-height:280px; overflow-y:auto; border-bottom:1px solid #eee; }\n  table { width:100%; border-collapse:collapse; }\n  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#52606d; border-bottom:1px solid #d5d9e0; padding:6px 4px; }\n  td { padding:8px 4px; border-bottom:1px solid #eee; vertical-align:middle; }\n  .r { text-align:right; }\n  .ud { display:block; font-size:12px; color:#616e7c; }\n  .cant { display:inline-flex; align-items:center; gap:6px; }\n  .cant output { min-width:1.5em; text-align:center; font-variant-numeric:tabular-nums; }\n  .cant button { width:32px; height:32px; padding:0; border-radius:50%; font-size:17px; line-height:1; }\n  .quitar { padding:3px 9px; font-size:13px; }\n  .vacio { color:#52606d; font-style:italic; text-align:center; padding:18px 4px; }\n  .total { display:flex; justify-content:space-between; align-items:baseline; font-size:18px; margin:14px 0; }\n  .total small { font-size:14px; color:#52606d; }\n  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }\n  button { font:inherit; font-size:15px; padding:8px 16px; border:1px solid #c4c4c4; border-radius:8px; background:#ececec; color:#1f2933; cursor:pointer; }\n  button:hover:not(:disabled) { filter:brightness(.95); }\n  button.main { background:#1f3a63; color:#fff; border-color:#1f3a63; margin-left:auto; }\n  button.enlace { background:none; border:none; padding:0 4px; color:#1f3a63; text-decoration:underline; font-weight:700; }\n  button:disabled { background:#e6e6e6; color:#6b6b6b; border-color:#d0d0d0; cursor:not-allowed; }\n  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }\n  .motivo { margin:10px 0 0; font-size:14px; color:#6b3d00; text-align:right; }\n  .ok { margin:12px 0 0; font-size:14px; color:#1d6b2f; min-height:1.2em; }\n  .ok.aviso { color:#6b3d00; }\n  .resumen { margin-top:16px; border:1px solid #b7dfc3; background:#f0faf3; border-radius:10px; padding:14px 16px; }\n  .resumen h3 { margin:0 0 6px; font-size:16px; color:#14532d; }\n  .resumen p { margin:0 0 8px; font-size:14px; color:#3e4c59; }\n  .resumen ul { margin:0 0 8px; padding-left:1.1rem; font-size:14px; }\n  .resumen .total { font-size:16px; margin:0; }\n\n  /* Móvil: cada línea del carrito pasa a ser una tarjeta */\n  @media (max-width: 520px) {\n    header { padding:12px 16px; }\n    table, tbody, tr, td { display:block; width:100%; }\n    tr.cabecera { display:none; }\n    tr { border-bottom:1px solid #eee; padding:8px 0; display:grid; grid-template-columns:1fr auto; gap:4px 8px; }\n    td { border:none; padding:2px 0; }\n    td.r { text-align:left; }\n    td.subtotal, td.acciones { text-align:right; }\n    button.main { width:100%; margin-left:0; }\n  }\n", f = class extends HTMLElement {
	#e = u.leer();
	#t = null;
	#n = {
		texto: "",
		tipo: "ok"
	};
	#r = null;
	#i = null;
	get #a() {
		return this.#t?.id ?? null;
	}
	#o = (t) => {
		let n = l(t.detail);
		if (!n) {
			console.warn(`[compra] ${e} con datos que no cumplen el contrato; se ignora`, t.detail);
			return;
		}
		let r = this.#e.find((e) => e.productoId === n.productoId), i = r ? r.cantidad : 0, a = Math.min(99, i + n.cantidad);
		r ? r.cantidad = a : this.#e.push({
			...n,
			cantidad: a
		}), this.#r = null, this.#h(a < i + n.cantidad ? `Máximo 99 unidades de «${n.nombre}»` : `Añadido: ${n.nombre}`, a < i + n.cantidad ? "aviso" : "ok");
	};
	#s = (e) => {
		let t = e.detail || {}, n = this.#a, r = t.autenticado === !0 && t.usuario && t.usuario.id != null ? t.usuario : null;
		this.#t = r ? {
			id: String(r.id),
			email: r.email ?? "",
			nombre: r.nombre ?? ""
		} : null, n !== this.#a && (this.#n = {
			texto: "",
			tipo: "ok"
		}, this.#i = null), this.#_();
	};
	connectedCallback() {
		this.shadowRoot || (this.attachShadow({ mode: "open" }), this.shadowRoot.addEventListener("click", (e) => this.#g(e))), window.addEventListener(e, this.#o), window.addEventListener(t, this.#s), this.#_();
	}
	disconnectedCallback() {
		window.removeEventListener(e, this.#o), window.removeEventListener(t, this.#s);
	}
	#c() {
		return this.#e.reduce((e, t) => e + r(t.precio) * t.cantidad, 0);
	}
	#l() {
		return this.#e.reduce((e, t) => e + t.cantidad, 0);
	}
	#u() {
		return this.#e.length ? this.#a ? null : "Inicia sesión en Identidad para confirmar el pedido." : "El carrito está vacío: añade un producto del catálogo para poder confirmar.";
	}
	#d() {
		if (this.#u()) return;
		let e = {
			pedidoId: c(),
			usuarioId: this.#a,
			creadoEn: (/* @__PURE__ */ new Date()).toISOString(),
			total: i(this.#c()),
			lineas: this.#e.map(({ productoId: e, nombre: t, precio: n, cantidad: r }) => ({
				productoId: e,
				nombre: t,
				precio: n,
				cantidad: r
			}))
		};
		this.#e = [], this.#r = null, this.#i = e, window.dispatchEvent(new CustomEvent("ucjc:compra:pedido-confirmado@1", { detail: e })), this.#h(`Pedido ${e.pedidoId} confirmado (${a(e.total)})`);
	}
	#f(e, t) {
		let n = this.#e.find((t) => t.productoId === e);
		n && (t > 0 && n.cantidad >= 99 ? this.#h(`Máximo 99 unidades de «${n.nombre}»`, "aviso") : (n.cantidad += t, n.cantidad < 1 ? (this.#e = this.#e.filter((e) => e !== n), this.#h(`Quitado: ${n.nombre}`)) : this.#h("")));
	}
	#p() {
		this.#e.length && (this.#r = this.#e.map((e) => ({ ...e })), this.#e = [], this.#h("Carrito vaciado."));
	}
	#m() {
		this.#r && (this.#e = this.#r, this.#r = null, this.#h("Carrito recuperado."));
	}
	#h(e, t = "ok") {
		this.#n = {
			texto: e,
			tipo: t
		}, u.escribir(this.#e), this.#_();
	}
	#g(e) {
		let t = e.target.closest("button");
		t && !t.disabled && (t.dataset.a === "ok" ? this.#d() : t.dataset.a === "vaciar" ? this.#p() : t.dataset.a === "deshacer" ? this.#m() : t.dataset.mas ? this.#f(t.dataset.mas, 1) : t.dataset.menos ? this.#f(t.dataset.menos, -1) : t.dataset.quitar && this.#f(t.dataset.quitar, -Infinity));
	}
	#_() {
		let e = this.shadowRoot;
		if (!e) return;
		let t = e.activeElement, n = t?.dataset ? Object.entries(t.dataset).map(([e, t]) => `[data-${e}="${String(t).replace(/["\\]/g, "\\$&")}"]`).join("") : "", c = this.#u(), l = this.#e.length > 0, u = this.#l(), f = this.#t, p = l ? this.#e.map((e) => {
			let t = o(e.nombre), n = o(e.productoId);
			return `<tr>
              <td>${t}<span class="ud">${a(e.precio)} / ud.</span></td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${n}" aria-label="Quitar una unidad de ${t}">−</button>
                <output aria-label="Cantidad de ${t}">${e.cantidad}</output>
                <button type="button" data-mas="${n}" aria-label="Añadir una unidad de ${t}" ${e.cantidad >= 99 ? "disabled" : ""}>+</button>
              </span></td>
              <td class="r subtotal">${a(i(r(e.precio) * e.cantidad))}</td>
              <td class="r acciones"><button type="button" class="quitar" data-quitar="${n}" aria-label="Quitar ${t} del carrito">Quitar</button></td>
            </tr>`;
		}).join("") : "<tr><td colspan=\"4\" class=\"vacio\">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>", m = this.#i, h = m ? `<section class="resumen" aria-label="Último pedido confirmado">
          <h3>✅ Pedido confirmado</h3>
          <p><b>${o(m.pedidoId)}</b> · ${s(m.creadoEn)} · ${o(f?.email || m.usuarioId)}</p>
          <ul>${m.lineas.map((e) => `<li>${e.cantidad} × ${o(e.nombre)} — ${a(i(r(e.precio) * e.cantidad))}</li>`).join("")}</ul>
          <p class="total"><span>Total pagado</span><b>${a(m.total)}</b></p>
        </section>` : "";
		e.innerHTML = `
      <style>${d}</style>
      <header>
        <h1>UCJC Compra${u ? ` <span class="contador" aria-label="${u} artículos en el carrito">${u}</span>` : ""}</h1>
        <span class="chip ${f ? "" : "sin"}" title="${f ? o(f.email) : ""}">${f ? `Sesión: ${o(f.nombre || f.email || f.id)}` : "Sin sesión"}</span>
      </header>
      <main>
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${l ? "hecho" : ""}">1. Carrito</li>
          <li class="${f ? "hecho" : ""}">2. Sesión</li>
          <li class="${c ? "" : "hecho"}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Revisa los productos antes de confirmar el pedido. El carrito se guarda aunque recargues la página.</p>
        <div class="box">
          <div class="lista"><table>
            <tr class="cabecera"><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${p}
          </table></div>
          <p class="total"><small>${u} artículo${u === 1 ? "" : "s"}</small><b>Total: <span data-total>${a(i(this.#c()))}</span></b></p>
          <div class="row">
            <button type="button" data-a="vaciar" ${l ? "" : "disabled"}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${c ? "disabled aria-describedby=\"motivo\"" : ""}>Confirmar pedido</button>
          </div>
          ${c ? `<p id="motivo" class="motivo">${c}</p>` : ""}
          <p class="ok ${this.#n.tipo === "aviso" ? "aviso" : ""}" role="status">${o(this.#n.texto)}${this.#r ? " <button type=\"button\" class=\"enlace\" data-a=\"deshacer\">Deshacer</button>" : ""}</p>
        </div>
        ${h}
      </main>`, n && e.querySelector(n)?.focus();
	}
};
customElements.get("ucjc-compra") || customElements.define("ucjc-compra", f);
// src/main.js
var p = {
	nombre: "compra",
	version: "0.1.0"
};
export { p as default };
