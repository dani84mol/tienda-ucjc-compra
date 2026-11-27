
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mod from './main.js';

const SES = 'ucjc:identidad:sesion-cambiada@1';
const ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const PED = 'ucjc:compra:pedido-confirmado@1';

const emitir = (tipo, detail) => window.dispatchEvent(new CustomEvent(tipo, { detail }));
const entrar = () => emitir(SES, { autenticado: true, usuario: { id: 'u-demo', email: 'demo@alumno.ucjc.edu' } });
const salir = () => emitir(SES, { autenticado: false, usuario: null });
const camiseta = { productoId: 'p-1', nombre: 'Camiseta', precio: 19.99, cantidad: 1 };

const CAMP = 'ucjc:descubrimiento:campana-cambiada@1';
const MON = 'ucjc:descubrimiento:moneda-cambiada@1';
const PED2 = 'ucjc:compra:pedido-confirmado@2';
const bf = (activa) => emitir(CAMP, { activa, codigo: 'black-friday-2026', etiqueta: 'Black Friday UCJC', momento: new Date().toISOString() });
const moneda = (m) => emitir(MON, { moneda: m, momento: new Date().toISOString() });
// Clave de línea: producto | moneda | campaña
const L = (id, m = 'EUR', c = '') => `${id}|${m}|${c}`;

describe('ucjc-compra · Compra C', () => {
  let el;
  const $ = (s) => el.shadowRoot.querySelector(s);
  const confirmar = () => $('[data-a="ok"]');
  const total = () => $('[data-total]').textContent;
  const lineas = () => [...el.shadowRoot.querySelectorAll('tr[data-linea]')].map((tr) => tr.dataset.linea);

  beforeEach(() => {
    localStorage.clear();
    delete window.ucjcCampus;
    document.body.innerHTML = '';
    el = document.createElement('ucjc-compra');
    document.body.appendChild(el);
  });

  it('exporta los metadatos de carga de Compra', () => {
    expect(mod).toEqual({ nombre: 'compra', version: '0.4.0' });
    expect(customElements.get('ucjc-compra')).toBeDefined();
  });

  it('con el carrito vacío, confirmar está desactivado y explica por qué', () => {
    entrar();
    expect(confirmar().disabled).toBe(true);
    expect($('#motivo').textContent).toContain('carrito está vacío');
    expect(confirmar().getAttribute('aria-describedby')).toBe('motivo');
  });

  it('sin sesión no deja confirmar aunque haya productos', () => {
    emitir(ADD, camiseta);
    expect(confirmar().disabled).toBe(true);
    expect($('#motivo').textContent).toContain('Inicia sesión');
  });

  it('suma cantidades del mismo producto y calcula el total', () => {
    emitir(ADD, camiseta);
    emitir(ADD, { ...camiseta, cantidad: 2 });
    expect(el.shadowRoot.querySelectorAll('[data-quitar]').length).toBe(1);
    expect(total()).toBe('59,97 €');
  });

  it('confirma con el contrato pedido-confirmado@1 y el usuario de Identidad', () => {
    const spy = vi.fn();
    window.addEventListener(PED, spy);
    entrar();
    emitir(ADD, camiseta);
    emitir(ADD, { productoId: 'p-2', nombre: 'Taza', precio: 7.5, cantidad: 2 });
    confirmar().click();
    const d = spy.mock.calls.at(-1)[0].detail;
    expect(Object.keys(d).sort()).toEqual(['creadoEn', 'lineas', 'pedidoId', 'total', 'usuarioId']);
    expect(d).toMatchObject({ usuarioId: 'u-demo', total: 34.99 });
    expect(d.lineas[1]).toEqual({ productoId: 'p-2', nombre: 'Taza', precio: 7.5, cantidad: 2 });
    expect(new Date(d.creadoEn).toISOString()).toBe(d.creadoEn);
    expect(el.shadowRoot.querySelectorAll('[data-quitar]').length).toBe(0);
    window.removeEventListener(PED, spy);
  });

  it('al cerrar sesión vuelve a bloquear la confirmación', () => {
    entrar();
    emitir(ADD, camiseta);
    expect(confirmar().disabled).toBe(false);
    salir();
    expect(confirmar().disabled).toBe(true);
    expect($('.chip').textContent).toBe('Sin sesión');
  });

  it('los botones + y − cambian la cantidad y quitan la línea al llegar a 0', () => {
    emitir(ADD, camiseta);
    $(`[data-mas="${L('p-1')}"]`).click();
    expect(total()).toBe('39,98 €');
    $(`[data-menos="${L('p-1')}"]`).click();
    $(`[data-menos="${L('p-1')}"]`).click();
    expect($('.vacio')).not.toBeNull();
  });

  it('el nombre del producto se muestra como texto, no como HTML', () => {
    emitir(ADD, { ...camiseta, nombre: '<img src=x>' });
    expect(el.shadowRoot.querySelector('table img')).toBeNull();
  });

  it('no muestra el botón de producto demo de Compra A', () => {
    expect($('[data-a="demo"]')).toBeNull();
  });

  it('el botón Quitar elimina la línea entera', () => {
    emitir(ADD, { ...camiseta, cantidad: 3 });
    $(`[data-quitar="${L('p-1')}"]`).click();
    expect($('.vacio')).not.toBeNull();
  });

  it('al cambiar de usuario no deja a la vista el pedido del anterior', () => {
    entrar();
    emitir(ADD, camiseta);
    confirmar().click();
    expect($('.ok').textContent).toContain('confirmado');
    salir();
    expect($('.ok').textContent).toBe('');
  });

  it('se puede quitar y volver a poner sin errores (attachShadow una sola vez)', () => {
    const errores = vi.fn((e) => e.preventDefault());
    window.addEventListener('error', errores);
    el.remove();
    document.body.appendChild(el);
    window.removeEventListener('error', errores);
    expect(errores).not.toHaveBeenCalled();
    expect($('h1').textContent).toBe('UCJC Compra');
  });

  it('al quitarlo del DOM deja de escuchar eventos', () => {
    el.remove();
    emitir(ADD, camiseta);
    document.body.appendChild(el);
    expect($('.vacio')).not.toBeNull();
  });
  // ---------- Mejoras de Compra C ----------

  it('el pedido lleva SOLO los campos del contrato @1, también en cada línea', () => {
    const spy = vi.fn();
    window.addEventListener(PED, spy);
    entrar();
    emitir(ADD, camiseta);
    confirmar().click();
    const d = spy.mock.calls.at(-1)[0].detail;
    expect(Object.keys(d).sort()).toEqual(['creadoEn', 'lineas', 'pedidoId', 'total', 'usuarioId']);
    expect(Object.keys(d.lineas[0]).sort()).toEqual(['cantidad', 'nombre', 'precio', 'productoId']);
    expect(typeof d.pedidoId).toBe('string');
    expect(typeof d.usuarioId).toBe('string');
    window.removeEventListener(PED, spy);
  });

  it('el total no arrastra errores de coma flotante (0,10 + 0,20 = 0,30)', () => {
    const spy = vi.fn();
    window.addEventListener(PED, spy);
    entrar();
    emitir(ADD, { productoId: 'a', nombre: 'A', precio: 0.1, cantidad: 1 });
    emitir(ADD, { productoId: 'b', nombre: 'B', precio: 0.2, cantidad: 1 });
    confirmar().click();
    expect(spy.mock.calls.at(-1)[0].detail.total).toBe(0.3);
    window.removeEventListener(PED, spy);
  });

  it('cada pedido tiene un pedidoId distinto', () => {
    const ids = new Set();
    const spy = (e) => ids.add(e.detail.pedidoId);
    window.addEventListener(PED, spy);
    entrar();
    for (let i = 0; i < 5; i++) {
      emitir(ADD, camiseta);
      confirmar().click();
    }
    expect(ids.size).toBe(5);
    window.removeEventListener(PED, spy);
  });

  it('un doble clic en confirmar no manda el pedido dos veces', () => {
    const spy = vi.fn();
    window.addEventListener(PED, spy);
    entrar();
    emitir(ADD, camiseta);
    const boton = confirmar();
    boton.click();
    boton.click();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(PED, spy);
  });

  it('ignora eventos de añadir que no cumplen el contrato', () => {
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitir(ADD, { productoId: 'x', nombre: 'Sin precio', cantidad: 1 });
    emitir(ADD, { productoId: 'y', nombre: 'Negativo', precio: -5, cantidad: 1 });
    emitir(ADD, { productoId: 'z', nombre: 'Cero', precio: 5, cantidad: 0 });
    emitir(ADD, { nombre: 'Sin id', precio: 5, cantidad: 1 });
    expect($('.vacio')).not.toBeNull();
    expect(avisos).toHaveBeenCalledTimes(4);
    avisos.mockRestore();
  });

  it('muestra el nombre o el email de la sesión, no solo el id', () => {
    emitir(SES, { autenticado: true, usuario: { id: 'u-1', email: 'ana@alumno.ucjc.edu', nombre: 'Ana Pérez' } });
    expect($('.chip').textContent).toBe('Sesión: Ana Pérez');
    emitir(SES, { autenticado: true, usuario: { id: 'u-2', email: 'luis@ucjc.edu' } });
    expect($('.chip').textContent).toBe('Sesión: luis@ucjc.edu');
  });

  it('tras confirmar muestra el resumen del pedido y lo borra al cerrar sesión', () => {
    entrar();
    emitir(ADD, { ...camiseta, cantidad: 2 });
    confirmar().click();
    expect($('.resumen').textContent).toContain('2 × Camiseta');
    expect($('.resumen').textContent).toContain('39,98 €');
    salir();
    expect($('.resumen')).toBeNull();
  });

  it('Vaciar se puede deshacer', () => {
    emitir(ADD, camiseta);
    $('[data-a="vaciar"]').click();
    expect($('.vacio')).not.toBeNull();
    $('[data-a="deshacer"]').click();
    expect(total()).toBe('19,99 €');
  });

  it('el carrito se mantiene al recargar la página', () => {
    emitir(ADD, { ...camiseta, cantidad: 3 });
    el.remove();
    const otro = document.createElement('ucjc-compra');
    document.body.appendChild(otro);
    expect(otro.shadowRoot.querySelector('[data-total]').textContent).toBe('59,97 €');
  });

  it('no deja pasar de 99 unidades por producto', () => {
    emitir(ADD, { ...camiseta, cantidad: 98 });
    emitir(ADD, { ...camiseta, cantidad: 5 });
    expect($('.cant output').textContent).toBe('99');
    expect($(`[data-mas="${L('p-1')}"]`).disabled).toBe(true);
  });

  it('muestra cuántos artículos hay en la cabecera', () => {
    emitir(ADD, { ...camiseta, cantidad: 2 });
    emitir(ADD, { productoId: 'p-2', nombre: 'Taza', precio: 7.5, cantidad: 1 });
    expect($('.contador').textContent).toBe('3');
  });

  it('después de pulsar + el foco sigue en el mismo botón', () => {
    emitir(ADD, camiseta);
    $(`[data-mas="${L('p-1')}"]`).focus();
    $(`[data-mas="${L('p-1')}"]`).click();
    expect(el.shadowRoot.activeElement?.dataset.mas).toBe(L('p-1'));
  });

  // ---------- Campaña (campana-cambiada@1, firmado) ----------

  it('con Black Friday activo muestra el aviso arriba, y lo quita al terminar', () => {
    expect($('.campana')).toBeNull();
    bf(true);
    expect($('.campana').textContent).toContain('Black Friday UCJC activo');
    bf(false);
    expect($('.campana')).toBeNull();
  });

  it('lo añadido durante la campaña lleva la etiqueta de Black Friday', () => {
    bf(true);
    emitir(ADD, { ...camiseta, precio: 15.99 });
    expect($('.etiqueta.bf').textContent).toContain('Black Friday UCJC');
    expect($('[data-en-campana]').textContent).toContain('1');
  });

  it('el mismo producto con y sin campaña son líneas distintas', () => {
    emitir(ADD, camiseta);
    bf(true);
    emitir(ADD, { ...camiseta, precio: 15.99 });
    emitir(ADD, { ...camiseta, precio: 15.99 });
    expect(lineas()).toEqual([L('p-1'), L('p-1', 'EUR', 'black-friday-2026')]);
    expect(total()).toBe('51,97 €'); // 19,99 + 2 × 15,99
  });

  it('la campaña se aplica igual a todos los productos que se añaden mientras está activa', () => {
    bf(true);
    emitir(ADD, camiseta);
    emitir(ADD, { productoId: 'p-2', nombre: 'Taza', precio: 6, cantidad: 1 });
    expect(el.shadowRoot.querySelectorAll('.etiqueta.bf').length).toBe(2);
    bf(false);
    emitir(ADD, { productoId: 'p-3', nombre: 'Llavero', precio: 5, cantidad: 1 });
    expect(el.shadowRoot.querySelectorAll('.etiqueta.bf').length).toBe(2);
  });

  it('ignora una campaña mal formada', () => {
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitir(CAMP, { activa: 'sí', codigo: 'bf' });
    emitir(CAMP, { activa: true });
    expect($('.campana')).toBeNull();
    expect(avisos).toHaveBeenCalledTimes(2);
    avisos.mockRestore();
  });

  // ---------- Moneda (moneda-cambiada@1, la marca el catálogo) ----------

  it('Compra no tiene selector de moneda propio', () => {
    emitir(ADD, camiseta);
    expect($('select')).toBeNull();
  });

  it('por defecto todo va en euros', () => {
    emitir(ADD, camiseta);
    expect(lineas()).toEqual([L('p-1')]);
    expect(total()).toBe('19,99 €');
    expect($('.etiqueta')).toBeNull();
  });

  it('si el catálogo pasa a dólares, lo nuevo entra en dólares y en otra línea', () => {
    emitir(ADD, camiseta);
    moneda('USD');
    emitir(ADD, camiseta);
    expect(lineas()).toEqual([L('p-1'), L('p-1', 'USD')]);
    expect($('[data-subtotal="EUR"]').textContent).toContain('19,99 €');
    expect($('[data-subtotal="USD"]').textContent).toContain('22,01 $'); // 19,99 × 1,1014 → 22,01 (a la baja)
    expect(total()).toBe('39,98 €'); // con monedas mezcladas se cobra en euros
  });

  it('con todo en una moneda, el total va en esa moneda y su equivalente en euros', () => {
    moneda('GBP');
    emitir(ADD, { ...camiseta, cantidad: 2 });
    expect(total()).toBe('33,36 £'); // 16,68 £ × 2
    expect($('[data-equivale]').textContent).toContain('39,98 €');
  });

  it('producto, moneda y campaña distintos → cuatro líneas', () => {
    emitir(ADD, camiseta);
    moneda('USD');
    emitir(ADD, camiseta);
    bf(true);
    emitir(ADD, { ...camiseta, precio: 15.99 });
    moneda('EUR');
    emitir(ADD, { ...camiseta, precio: 15.99 });
    expect(lineas()).toEqual([
      L('p-1'),
      L('p-1', 'USD'),
      L('p-1', 'USD', 'black-friday-2026'),
      L('p-1', 'EUR', 'black-friday-2026'),
    ]);
  });

  it('ignora una moneda que no conocemos', () => {
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    moneda('JPY');
    emitir(ADD, camiseta);
    expect(lineas()).toEqual([L('p-1')]);
    avisos.mockRestore();
  });

  it('pagando en dólares y en campaña, el @1 sigue en euros y con sus 5 campos', () => {
    const spy = vi.fn();
    window.addEventListener(PED, spy);
    entrar();
    moneda('USD');
    bf(true);
    emitir(ADD, { ...camiseta, precio: 15.99, cantidad: 2 });
    confirmar().click();
    const d = spy.mock.calls.at(-1)[0].detail;
    expect(Object.keys(d).sort()).toEqual(['creadoEn', 'lineas', 'pedidoId', 'total', 'usuarioId']);
    expect(d.total).toBe(31.98);
    expect(d.lineas).toEqual([{ productoId: 'p-1', nombre: 'Camiseta', precio: 15.99, cantidad: 2 }]);
    window.removeEventListener(PED, spy);
  });

  it('mientras @2 esté propuesto no se emite', () => {
    const spy = vi.fn();
    window.addEventListener(PED2, spy);
    entrar();
    moneda('GBP');
    emitir(ADD, camiseta);
    confirmar().click();
    expect(spy).not.toHaveBeenCalled();
    window.removeEventListener(PED2, spy);
  });

  it('el resumen del pedido marca qué productos eran de Black Friday', () => {
    entrar();
    bf(true);
    emitir(ADD, { ...camiseta, precio: 15.99 });
    confirmar().click();
    expect($('.resumen').textContent).toContain('(Black Friday UCJC)');
    expect($('.resumen').textContent).toContain('15,99 €');
  });

  it('la moneda y la campaña de cada línea se mantienen al recargar', () => {
    moneda('USD');
    bf(true);
    emitir(ADD, camiseta);
    el.remove();
    const otro = document.createElement('ucjc-compra');
    document.body.appendChild(otro);
    expect(otro.shadowRoot.querySelector('tr[data-linea]').dataset.linea).toBe(L('p-1', 'USD', 'black-friday-2026'));
  });

  it('un carrito guardado por una versión antigua (sin moneda ni campaña) se recupera en euros', () => {
    localStorage.setItem('ucjc-compra:carrito', JSON.stringify([{ productoId: 'p-9', nombre: 'Viejo', precio: 3, cantidad: 1 }]));
    el.remove();
    const otro = document.createElement('ucjc-compra');
    document.body.appendChild(otro);
    expect(otro.shadowRoot.querySelector('tr[data-linea]').dataset.linea).toBe(L('p-9'));
  });

  // ---------- presentacion-campus@1 ----------

  it('el CSS no lleva !important y todo color escrito a mano es solo valor de reserva', () => {
    const hoja = $('style').textContent;
    expect(hoja.includes('!important')).toBe(false);
    const colores = hoja.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? [];
    expect(colores.length > 0).toBe(true);
    const sueltos = hoja.match(/(?<!var\(--ucjc-[a-z-]+,\s*)(#[0-9a-fA-F]{3,8}\b|rgba?\()/g);
    expect(sueltos).toBeNull();
    expect(hoja.match(/font-family:(?!\s*var\(--ucjc-font-)/g)).toBeNull();
  });

  it('con ucjcCampus escucha y emite a través de él, y al quitarse deja de escuchar', () => {
    const quitados = [];
    const emitidos = [];
    window.ucjcCampus = {
      version: '1',
      escuchar(nombre, fn) {
        window.addEventListener(nombre, fn);
        return () => {
          quitados.push(nombre);
          window.removeEventListener(nombre, fn);
        };
      },
      emitir(nombre, detail) {
        emitidos.push(nombre);
        window.dispatchEvent(new CustomEvent(nombre, { detail }));
      },
    };
    el.remove();
    const otro = document.createElement('ucjc-compra');
    document.body.appendChild(otro);
    entrar();
    emitir(ADD, camiseta);
    otro.shadowRoot.querySelector('[data-a="ok"]').click();
    expect(emitidos).toEqual([PED]);
    otro.remove();
    expect(quitados.sort()).toEqual([ADD, CAMP, SES, MON].sort());
  });

  it('sin ucjcCampus avisa por consola y sigue funcionando con window', () => {
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    el.remove();
    const otro = document.createElement('ucjc-compra');
    document.body.appendChild(otro);
    expect(avisos).toHaveBeenCalled();
    emitir(ADD, camiseta);
    expect(otro.shadowRoot.querySelector('[data-total]').textContent).toBe('19,99 €');
    avisos.mockRestore();
  });
});
