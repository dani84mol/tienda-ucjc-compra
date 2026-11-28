// src/ucjc-compra.js
var e = "ucjc:descubrimiento:anadir-al-carrito@1", t = "ucjc:identidad:sesion-cambiada@1", n = "ucjc-compra:carrito", r = "ucjc-compra:moneda", i = {
	EUR: {
		simbolo: "€",
		nombre: "Euros",
		tasa: 1
	},
	USD: {
		simbolo: "$",
		nombre: "Dólares",
		tasa: 1.1014
	},
	GBP: {
		simbolo: "£",
		nombre: "Libras",
		tasa: .8345
	}
}, a = "16/11/2026", o = (e) => Math.round(e * 100), s = (e) => e / 100, c = (e) => `${e.toFixed(2).replace(".", ",")} €`, l = (e, t) => Math.floor(o(e) * i[t].tasa + 1e-9), u = (e, t) => `${s(e).toFixed(2).replace(".", ",")} ${i[t].simbolo}`, d = (e) => String(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), f = (e) => new Date(e).toLocaleTimeString("es-ES", {
	hour: "2-digit",
	minute: "2-digit"
});
function p() {
	return `PED-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}
function m(e) {
	if (!e || typeof e != "object") return null;
	let t = e.productoId == null ? "" : String(e.productoId).trim(), n = typeof e.nombre == "string" ? e.nombre.trim() : "", r = Number(e.precio), i = Number(e.cantidad);
	return !t || !n || !Number.isFinite(r) || r < 0 || !Number.isInteger(i) || i < 1 ? null : {
		productoId: t,
		nombre: n,
		precio: r,
		cantidad: i
	};
}
var h = {
	leer() {
		try {
			let e = localStorage.getItem(r);
			return e in i ? e : "EUR";
		} catch {
			return "EUR";
		}
	},
	escribir(e) {
		try {
			localStorage.setItem(r, e);
		} catch {}
	}
}, g = {
	leer() {
		try {
			let e = JSON.parse(localStorage.getItem(n) || "[]");
			return Array.isArray(e) ? e.map(m).filter(Boolean) : [];
		} catch {
			return [];
		}
	},
	escribir(e) {
		try {
			localStorage.setItem(n, JSON.stringify(e));
		} catch {}
	}
}, _ = "\n  :host { display:block; font:16px/1.5 system-ui, Arial, sans-serif; color:#1f2933; }\n  * { box-sizing:border-box; }\n  header { background:#1f3a63; color:#fff; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; }\n  header h1 { margin:0; font-size:20px; display:flex; align-items:center; gap:.5rem; }\n  .contador { font-size:13px; font-weight:700; background:#fff; color:#1f3a63; border-radius:999px; padding:1px 9px; }\n  .chip { font-size:13px; padding:3px 10px; border-radius:999px; background:#e3f1e7; color:#14532d; font-weight:700; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n  .chip.sin { background:#ffe7c2; color:#6b3d00; }\n  main { max-width:680px; margin:24px auto; padding:0 16px; }\n  ol.pasos { display:flex; gap:6px; list-style:none; padding:0; margin:0 0 14px; font-size:13px; }\n  ol.pasos li { flex:1; text-align:center; padding:4px; border-radius:6px; background:#eef1f6; color:#52606d; }\n  ol.pasos li.hecho { background:#1f3a63; color:#fff; font-weight:700; }\n  h2 { font-size:20px; margin:0 0 4px; }\n  .sub { margin:0 0 16px; color:#52606d; font-size:14px; }\n  .box { background:#fff; border:1px solid #cbd2d9; border-radius:10px; padding:16px; }\n  .lista { max-height:280px; overflow-y:auto; border-bottom:1px solid #eee; }\n  table { width:100%; border-collapse:collapse; }\n  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#52606d; border-bottom:1px solid #d5d9e0; padding:6px 4px; }\n  td { padding:8px 4px; border-bottom:1px solid #eee; vertical-align:middle; }\n  .r { text-align:right; }\n  .ud { display:block; font-size:12px; color:#616e7c; }\n  .cant { display:inline-flex; align-items:center; gap:6px; }\n  .cant output { min-width:1.5em; text-align:center; font-variant-numeric:tabular-nums; }\n  .cant button { width:32px; height:32px; padding:0; border-radius:50%; font-size:17px; line-height:1; }\n  .quitar { padding:3px 9px; font-size:13px; }\n  .vacio { color:#52606d; font-style:italic; text-align:center; padding:18px 4px; }\n  .total { display:flex; justify-content:space-between; align-items:baseline; font-size:18px; margin:14px 0; }\n  .total small { font-size:14px; color:#52606d; }\n  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }\n  button { font:inherit; font-size:15px; padding:8px 16px; border:1px solid #c4c4c4; border-radius:8px; background:#ececec; color:#1f2933; cursor:pointer; }\n  button:hover:not(:disabled) { filter:brightness(.95); }\n  button.main { background:#1f3a63; color:#fff; border-color:#1f3a63; margin-left:auto; }\n  button.enlace { background:none; border:none; padding:0 4px; color:#1f3a63; text-decoration:underline; font-weight:700; }\n  button:disabled { background:#e6e6e6; color:#6b6b6b; border-color:#d0d0d0; cursor:not-allowed; }\n  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }\n  .motivo { margin:10px 0 0; font-size:14px; color:#6b3d00; text-align:right; }\n  .ok { margin:12px 0 0; font-size:14px; color:#1d6b2f; min-height:1.2em; }\n  .ok.aviso { color:#6b3d00; }\n  .resumen { margin-top:16px; border:1px solid #b7dfc3; background:#f0faf3; border-radius:10px; padding:14px 16px; }\n  .resumen h3 { margin:0 0 6px; font-size:16px; color:#14532d; }\n  .resumen p { margin:0 0 8px; font-size:14px; color:#3e4c59; }\n  .resumen ul { margin:0 0 8px; padding-left:1.1rem; font-size:14px; }\n  .resumen .total { font-size:16px; margin:0; }\n  .moneda { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:0 0 12px; font-size:14px; }\n  .moneda select { font:inherit; padding:6px 10px; border:1px solid #c4c4c4; border-radius:8px; background:#fff; }\n  .moneda select:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }\n  .moneda small { color:#52606d; }\n\n  /* Móvil: cada línea del carrito pasa a ser una tarjeta */\n  @media (max-width: 520px) {\n    header { padding:12px 16px; }\n    table, tbody, tr, td { display:block; width:100%; }\n    tr.cabecera { display:none; }\n    tr { border-bottom:1px solid #eee; padding:8px 0; display:grid; grid-template-columns:1fr auto; gap:4px 8px; }\n    td { border:none; padding:2px 0; }\n    td.r { text-align:left; }\n    td.subtotal, td.acciones { text-align:right; }\n    button.main { width:100%; margin-left:0; }\n  }\n", v = class extends HTMLElement {
	#e = g.leer();
	#t = null;
	#n = {
		texto: "",
		tipo: "ok"
	};
	#r = null;
	#i = null;
	#a = h.leer();
	get #o() {
		return this.#t?.id ?? null;
	}
	#s = (t) => {
		let n = m(t.detail);
		if (!n) {
			console.warn(`[compra] ${e} con datos que no cumplen el contrato; se ignora`, t.detail);
			return;
		}
		let r = this.#e.find((e) => e.productoId === n.productoId), i = r ? r.cantidad : 0, a = Math.min(99, i + n.cantidad);
		r ? r.cantidad = a : this.#e.push({
			...n,
			cantidad: a
		}), this.#r = null, this.#v(a < i + n.cantidad ? `Máximo 99 unidades de «${n.nombre}»` : `Añadido: ${n.nombre}`, a < i + n.cantidad ? "aviso" : "ok");
	};
	#c = (e) => {
		let t = e.detail || {}, n = this.#o, r = t.autenticado === !0 && t.usuario && t.usuario.id != null ? t.usuario : null;
		this.#t = r ? {
			id: String(r.id),
			email: r.email ?? "",
			nombre: r.nombre ?? ""
		} : null, n !== this.#o && (this.#n = {
			texto: "",
			tipo: "ok"
		}, this.#i = null), this.#b();
	};
	connectedCallback() {
		this.shadowRoot || (this.attachShadow({ mode: "open" }), this.shadowRoot.addEventListener("click", (e) => this.#y(e)), this.shadowRoot.addEventListener("change", (e) => {
			e.target.matches("select[data-moneda]") && this.#d(e.target.value);
		})), window.addEventListener(e, this.#s), window.addEventListener(t, this.#c), this.#b();
	}
	disconnectedCallback() {
		window.removeEventListener(e, this.#s), window.removeEventListener(t, this.#c);
	}
	#l() {
		return this.#e.reduce((e, t) => e + o(t.precio) * t.cantidad, 0);
	}
	#u(e = this.#a) {
		return this.#e.reduce((t, n) => t + l(n.precio, e) * n.cantidad, 0);
	}
	#d(e) {
		e in i && e !== this.#a && (this.#a = e, h.escribir(e), this.#v(`Pagarás en ${i[e].nombre.toLowerCase()}.`));
	}
	#f() {
		return this.#e.reduce((e, t) => e + t.cantidad, 0);
	}
	#p() {
		return this.#e.length ? this.#o ? null : "Inicia sesión en Identidad para confirmar el pedido." : "El carrito está vacío: añade un producto del catálogo para poder confirmar.";
	}
	#m() {
		if (this.#p()) return;
		let e = {
			pedidoId: p(),
			usuarioId: this.#o,
			creadoEn: (/* @__PURE__ */ new Date()).toISOString(),
			total: s(this.#l()),
			lineas: this.#e.map(({ productoId: e, nombre: t, precio: n, cantidad: r }) => ({
				productoId: e,
				nombre: t,
				precio: n,
				cantidad: r
			}))
		}, t = this.#a, n = {
			moneda: t,
			total: s(this.#u(t)),
			lineas: e.lineas.map((e) => ({
				...e,
				precio: s(l(e.precio, t))
			}))
		};
		this.#e = [], this.#r = null, this.#i = {
			...e,
			pagado: n
		}, window.dispatchEvent(new CustomEvent("ucjc:compra:pedido-confirmado@1", { detail: e })), this.#v(`Pedido ${e.pedidoId} confirmado (${u(o(n.total), t)})`);
	}
	#h(e, t) {
		let n = this.#e.find((t) => t.productoId === e);
		n && (t > 0 && n.cantidad >= 99 ? this.#v(`Máximo 99 unidades de «${n.nombre}»`, "aviso") : (n.cantidad += t, n.cantidad < 1 ? (this.#e = this.#e.filter((e) => e !== n), this.#v(`Quitado: ${n.nombre}`)) : this.#v("")));
	}
	#g() {
		this.#e.length && (this.#r = this.#e.map((e) => ({ ...e })), this.#e = [], this.#v("Carrito vaciado."));
	}
	#_() {
		this.#r && (this.#e = this.#r, this.#r = null, this.#v("Carrito recuperado."));
	}
	#v(e, t = "ok") {
		this.#n = {
			texto: e,
			tipo: t
		}, g.escribir(this.#e), this.#b();
	}
	#y(e) {
		let t = e.target.closest("button");
		t && !t.disabled && (t.dataset.a === "ok" ? this.#m() : t.dataset.a === "vaciar" ? this.#g() : t.dataset.a === "deshacer" ? this.#_() : t.dataset.mas ? this.#h(t.dataset.mas, 1) : t.dataset.menos ? this.#h(t.dataset.menos, -1) : t.dataset.quitar && this.#h(t.dataset.quitar, -Infinity));
	}
	#b() {
		let e = this.shadowRoot;
		if (!e) return;
		let t = e.activeElement, n = t?.dataset ? Object.entries(t.dataset).map(([e, t]) => `[data-${e}="${String(t).replace(/["\\]/g, "\\$&")}"]`).join("") : "", r = this.#p(), p = this.#e.length > 0, m = this.#f(), h = this.#t, g = this.#a, v = p ? this.#e.map((e) => {
			let t = d(e.nombre), n = d(e.productoId);
			return `<tr>
              <td>${t}<span class="ud">${u(l(e.precio, g), g)} / ud.</span></td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${n}" aria-label="Quitar una unidad de ${t}">−</button>
                <output aria-label="Cantidad de ${t}">${e.cantidad}</output>
                <button type="button" data-mas="${n}" aria-label="Añadir una unidad de ${t}" ${e.cantidad >= 99 ? "disabled" : ""}>+</button>
              </span></td>
              <td class="r subtotal">${u(l(e.precio, g) * e.cantidad, g)}</td>
              <td class="r acciones"><button type="button" class="quitar" data-quitar="${n}" aria-label="Quitar ${t} del carrito">Quitar</button></td>
            </tr>`;
		}).join("") : "<tr><td colspan=\"4\" class=\"vacio\">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>", y = this.#i, b = y ? `<section class="resumen" aria-label="Último pedido confirmado">
          <h3>✅ Pedido confirmado</h3>
          <p><b>${d(y.pedidoId)}</b> · ${f(y.creadoEn)} · ${d(h?.email || y.usuarioId)}</p>
          <ul>${y.pagado.lineas.map((e) => `<li>${e.cantidad} × ${d(e.nombre)} — ${u(o(e.precio) * e.cantidad, y.pagado.moneda)}</li>`).join("")}</ul>
          <p class="total"><span>Total pagado</span><b>${u(o(y.pagado.total), y.pagado.moneda)}</b></p>
          ${y.pagado.moneda === "EUR" ? "" : `<p><small>Equivale a ${c(y.total)}.</small></p>`}
        </section>` : "";
		e.innerHTML = `
      <style>${_}</style>
      <header>
        <h1>UCJC Compra${m ? ` <span class="contador" aria-label="${m} artículos en el carrito">${m}</span>` : ""}</h1>
        <span class="chip ${h ? "" : "sin"}" title="${h ? d(h.email) : ""}">${h ? `Sesión: ${d(h.nombre || h.email || h.id)}` : "Sin sesión"}</span>
      </header>
      <main>
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${p ? "hecho" : ""}">1. Carrito</li>
          <li class="${h ? "hecho" : ""}">2. Sesión</li>
          <li class="${r ? "" : "hecho"}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Revisa los productos antes de confirmar el pedido. El carrito se guarda aunque recargues la página.</p>
        <div class="moneda">
          <label for="moneda">Pagar en</label>
          <select id="moneda" data-moneda>
            ${Object.entries(i).map(([e, t]) => `<option value="${e}" ${e === g ? "selected" : ""}>${t.nombre} (${t.simbolo})</option>`).join("")}
          </select>
          ${g === "EUR" ? "" : `<small>1 € = ${String(i[g].tasa).replace(".", ",")} ${i[g].simbolo} · tipo de referencia BCE del ${a}, sin comisión</small>`}
        </div>
        <div class="box">
          <div class="lista"><table>
            <tr class="cabecera"><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${v}
          </table></div>
          <p class="total"><small>${m} artículo${m === 1 ? "" : "s"}</small><b>Total: <span data-total>${u(this.#u(), g)}</span></b></p>
          ${g !== "EUR" && p ? `<p class="sub" data-equivale>Equivale a ${c(s(this.#l()))}</p>` : ""}
          <div class="row">
            <button type="button" data-a="vaciar" ${p ? "" : "disabled"}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${r ? "disabled aria-describedby=\"motivo\"" : ""}>Confirmar pedido</button>
          </div>
          ${r ? `<p id="motivo" class="motivo">${r}</p>` : ""}
          <p class="ok ${this.#n.tipo === "aviso" ? "aviso" : ""}" role="status">${d(this.#n.texto)}${this.#r ? " <button type=\"button\" class=\"enlace\" data-a=\"deshacer\">Deshacer</button>" : ""}</p>
        </div>
        ${b}
      </main>`, n && e.querySelector(n)?.focus();
	}
};
customElements.get("ucjc-compra") || customElements.define("ucjc-compra", v);
// src/main.js
var y = {
	nombre: "compra",
	version: "0.2.0"
};
export { y as default };
