import { beforeEach, describe, expect, it, vi } from 'vitest';
import mod from './main.js';

const SES = 'ucjc:identidad:sesion-cambiada@1';
const ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const PED = 'ucjc:compra:pedido-confirmado@1';

const emitir = (tipo, detail) => window.dispatchEvent(new CustomEvent(tipo, { detail }));
const entrar = () => emitir(SES, { autenticado: true, usuario: { id: 'u-demo', email: 'demo@alumno.ucjc.edu' } });
const salir = () => emitir(SES, { autenticado: false, usuario: null });
const camiseta = { productoId: 'p-1', nombre: 'Camiseta', precio: 19.99, cantidad: 1 };

describe('ucjc-compra (Compra C, sobre el código de Compra B)', () => {
  let el;
  const $ = (s) => el.shadowRoot.querySelector(s);
  const confirmar = () => $('[data-a="ok"]');

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    el = document.createElement('ucjc-compra');
    document.body.appendChild(el);
  });

  it('exporta los metadatos de carga de Compra', () => {
    expect(mod).toEqual({ nombre: 'compra', version: '0.1.0' });
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
    expect($('[data-total]').textContent).toBe('59,97 €');
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
    $('[data-mas="p-1"]').click();
    expect($('[data-total]').textContent).toBe('39,98 €');
    $('[data-menos="p-1"]').click();
    $('[data-menos="p-1"]').click();
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
    $('[data-quitar="p-1"]').click();
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
    expect($('[data-total]').textContent).toBe('19,99 €');
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
    expect($('[data-mas="p-1"]').disabled).toBe(true);
  });

  it('muestra cuántos artículos hay en la cabecera', () => {
    emitir(ADD, { ...camiseta, cantidad: 2 });
    emitir(ADD, { productoId: 'p-2', nombre: 'Taza', precio: 7.5, cantidad: 1 });
    expect($('.contador').textContent).toBe('3');
  });

  it('después de pulsar + el foco sigue en el mismo botón', () => {
    emitir(ADD, camiseta);
    $('[data-mas="p-1"]').focus();
    $('[data-mas="p-1"]').click();
    expect(el.shadowRoot.activeElement?.dataset.mas).toBe('p-1');
  });
});
