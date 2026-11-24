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

## Pagar en euros, dólares o libras

Encima del carrito hay un selector **«Pagar en»**: Euros (€), Dólares ($) o Libras (£). La elección se recuerda al volver.

- Los precios llegan siempre en euros (así lo fija `anadir-al-carrito@1`) y se convierten con el **tipo de referencia del BCE** del 16/11/2026 (1 € = 1,1014 $ = 0,8345 £), sin comisión.
- Cada precio se redondea **hacia abajo** al céntimo: pagar en otra moneda nunca cuesta más que la conversión exacta.
- El total es la suma de las líneas que se ven, y debajo aparece su equivalente en euros.
- Los tipos están en `MONEDAS`, al principio de `src/ucjc-compra.js`.

**Eventos:**
- `pedido-confirmado@1` (firmado) sigue saliendo **siempre en euros y con sus 5 campos**, pague el usuario en la moneda que pague.
- `pedido-confirmado@2` (con `moneda`) está **propuesto**, no firmado. El código ya lo genera, pero está apagado con `EMITIR_PEDIDO_V2 = false`. Cuando se firme, se pone a `true` y saldrá con la moneda y los importes que ha pagado el usuario.

## Eventos (contratos `@1` firmados en [tienda-ucjc-contratos](https://github.com/cesar-andress/tienda-ucjc-contratos))

Mismos tres eventos que A y B, **sin añadir ni quitar campos**:

| Evento | Rol | Campos |
|---|---|---|
| `ucjc:descubrimiento:anadir-al-carrito@1` | escucha | `productoId`, `nombre`, `precio`, `cantidad` |
| `ucjc:identidad:sesion-cambiada@1` | escucha | `autenticado`, `usuario` (`id`, `email`, `nombre?`) o `null`. Solo deja confirmar si `autenticado === true` |
| `ucjc:compra:pedido-confirmado@1` | emite | `pedidoId`, `usuarioId`, `creadoEn`, `total`, `lineas[]` (`productoId`, `nombre`, `precio`, `cantidad`), siempre en euros |

Los tests comprueban que el pedido emitido lleva **exactamente** esos campos.

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

- Para el shell: `https://<usuario-u-organizacion>.github.io/tienda-ucjc-compra-c/vX.Y.Z/remote.js`
- Página propia: `https://<usuario-u-organizacion>.github.io/tienda-ucjc-compra-c/vX.Y.Z/`

Un tag no se mueve nunca: si hay que corregir algo, se publica una versión nueva. Exporta `{ nombre: 'compra', version }`.
