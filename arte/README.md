# Arte

Aquí está el material de dibujo en su forma original. **No se publica con el juego**: el juego usa
las hojas de sprites de `public/assets/img/`, que se arman a partir de estos archivos.

## `originales/`

Lo que entregó quien dibuja, con nombres estándar. Cada imagen mide **160×240 px**, que es un
cuadro de **32×48 px ampliado 5 veces** (así lo exporta ibisPaint X, la aplicación con la que se dibujan y pintan los sprites). Está organizado
por tema:

- `jugador/`: 12 cuadros (4 direcciones × quieto, paso 1, paso 2).
- `enemigos/`: 2 cuadros de caminar del enemigo débil y de cada una de las 4 ratas (azul, gris, blanca y negra).
- `escenario/`: 22 piezas del tileset, con un número de 2 cifras al principio.

Las reglas de nombres están en [`docs/guia-de-recursos.md`](../docs/guia-de-recursos.md).

## Cómo se arman las hojas

Se necesita [ImageMagick](https://imagemagick.org/) (`brew install imagemagick`). Primero se
reduce cada imagen a su tamaño real y después se juntan en una hoja. La reducción con `-filter
point` es **exacta** (sin pérdida) porque cada píxel está ampliado a un bloque de 5×5.

```bash
# Reducir una imagen a su tamaño real (160x240 -> 32x48)
magick jugador-abajo-quieto.png -filter point -resize 20% jugador-abajo-quieto-32x48.png

# Juntar cuadros en una hoja: 3 columnas, sin espacios, fondo transparente
magick montage cuadro-01.png cuadro-02.png cuadro-03.png -tile 3x1 -geometry +0+0 -background none hoja.png

# Juntar cuadros en una sola fila
magick cuadro-1.png cuadro-2.png +append -background none hoja.png
```

Orden de los cuadros en cada hoja (se cuentan de izquierda a derecha y de arriba abajo):

| Hoja                  | Disposición                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| `jugador.png`         | 3 columnas (quieto, paso 1, paso 2) × 4 filas (abajo, derecha, izquierda, arriba) |
| `enemigo-debil.png`   | 2 cuadros en una fila                                                             |
| `rata-<color>.png`    | 2 cuadros en una fila (`azul`, `gris`, `blanca`, `negra`)                         |
| `tileset-prision.png` | 8 columnas × 3 filas, en el orden de los números de los archivos                  |

Si quien dibuja entrega una hoja ya armada, no hace falta nada de esto: se copia a
`public/assets/img/` y se ajusta su entrada en `src/datos/recursos.js`.
