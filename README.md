# tienda-ucjc-compra-c

Tercera versión de la pieza **Compra** de la Tienda UCJC, para la prueba A/B del shell.

- Compra A: [`tienda-ucjc-compra/tienda-ucjc-compra`](https://github.com/tienda-ucjc-compra/tienda-ucjc-compra)
- Compra B: [`ucjc-ecommerce-identidad/tienda-ucjc-compra-b`](https://github.com/ucjc-ecommerce-identidad/tienda-ucjc-compra-b)

Custom element: `<ucjc-compra>`. Es el mismo que en A y B, para que el shell pueda cambiar una versión por otra sin romper nada.

## Qué mejora respecto a Compra B

Compra C **parte del código de Compra B** (`v0.2.0`). No cambia la etiqueta ni los eventos.

| Compra B | Compra C |
|---|---|
| El carrito se pierde al recargar la página | Se guarda en el navegador y sigue ahí al volver |
| La sesión muestra el `id` interno (`u-123`) | Muestra el nombre o, si no hay, el email |
| Tras confirmar solo queda una línea de texto | Resumen del pedido: número, hora, líneas y total |
| `pedidoId` = `PED-<milisegundos>` (dos pedidos en el mismo ms se repiten) | `PED-AAAAMMDD-XXXXXX` aleatorio, sin repeticiones |
| Total con decimales en coma flotante (0,1 + 0,2 = 0,30000000000000004) | Importes calculados en céntimos: el total cuadra siempre |
| Acepta datos mal formados (precio inventado como 0, cantidades negativas…) | Valida el `detail` y descarta lo que no cumple el contrato (con aviso en consola) |
| «Vaciar» borra sin vuelta atrás | «Vaciar» con botón «Deshacer» |
| Sin límite de unidades | Máximo 99 por producto, con aviso |
| Al pulsar + o − el foco del teclado se pierde | El foco se queda en el mismo botón |
| No se sabe cuántos artículos hay sin mirar la tabla | Contador de artículos en la cabecera |
| En móvil la tabla se aprieta | En móvil cada línea pasa a ser una tarjeta |

## Black Friday y moneda (v0.4.0)

Compra **no elige moneda ni aplica descuentos**: los decide el catálogo (Descubrimiento) y Compra los refleja.

- **Campaña** (`campana-cambiada@1`): mientras está activa, arriba aparece «🏷️ Black Friday UCJC activo» y cada producto que se añade lleva la etiqueta de la campaña. El precio llega ya con el descuento, en euros.
- **Moneda** (`moneda-cambiada@1`): lo que se añade se etiqueta con la moneda del catálogo en ese momento. El precio viaja en euros y se muestra en esa moneda con el tipo de referencia del BCE (16/11/2026: 1 € = 1,1014 $ = 0,8345 £), redondeando hacia abajo para que nunca salga más caro.
- **Una línea = producto + moneda + campaña.** El mismo producto en otra moneda o en campaña va en una línea aparte, porque no tiene el mismo precio.
- **Totales:** si todo está en una moneda, el total sale en esa moneda con su equivalente en euros. Si se mezclan monedas, salen los subtotales de cada una y el total a pagar en euros.

## Eventos ([tienda-ucjc-contratos](https://github.com/cesar-andress/tienda-ucjc-contratos))

| Evento | Estado | Rol | Campos |
|---|---|---|---|
| `ucjc:descubrimiento:anadir-al-carrito@1` | firmado | escucha | `productoId`, `nombre`, `precio` (€), `cantidad` |
| `ucjc:identidad:sesion-cambiada@1` | firmado | escucha | `autenticado`, `usuario` (`id`, `email`, `nombre?`) o `null` |
| `ucjc:descubrimiento:campana-cambiada@1` | firmado | escucha | `activa`, `codigo`, `etiqueta`, `momento` |
| `ucjc:descubrimiento:moneda-cambiada@1` | propuesto | escucha | `moneda`, `momento` |
| `ucjc:compra:pedido-confirmado@1` | firmado | **emite** | `pedidoId`, `usuarioId`, `creadoEn`, `total`, `lineas[]`. Siempre en euros y con estos 5 campos exactos |
| `ucjc:compra:pedido-confirmado@2` | propuesto | apagado | `EMITIR_PEDIDO_V2 = false`. Cuando se firme, sale con `moneda` (la del carrito, o `EUR` si hay varias) y `campaña` (si todo el pedido es de la misma) |

Hay un test que comprueba el `detail` de cada evento que se emite.

## presentacion-campus@1

- **CSS:** color, tipografía, radios y espacios salen de `var(--ucjc-*, reserva)`. Un color escrito a mano solo aparece como valor de reserva. Ni `font-family` propia ni `!important` (hay un test que lo comprueba sobre la hoja de la pieza).
- **JS:** al arrancar se comprueba `window.ucjcCampus?.version === '1'`. Con campus se escucha con `ucjcCampus.escuchar` y se emite con `ucjcCampus.emitir`; sin campus (página de demo, tests), con `window`. Los cuatro listeners de `window` se quitan en `disconnectedCallback`.

## Equipo

| Nombre | Rol |
|---|---|
| _Por completar_ | Responsable |

## Cómo arrancarlo

```bash
npm install
npm run dev
npm test
```

## Cómo se publica

`npm run build` genera `dist/remote.js`. Al subir un tag `vX.Y.Z`, el workflow `release.yml` pasa los tests y lo publica en la rama `gh-pages` dentro de `vX.Y.Z/`.

- Para el shell: `https://dani84mol.github.io/tienda-ucjc-compra/vX.Y.Z/remote.js`
- Página propia: `https://dani84mol.github.io/tienda-ucjc-compra/vX.Y.Z/`

Un tag no se mueve nunca: si hay que corregir algo, se publica una versión nueva. Exporta `{ nombre: 'compra', version }`.
