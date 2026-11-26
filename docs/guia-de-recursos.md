# Guía de recursos (sprites, fondos y audio)

Para los compañeros que dibujan y para quienes programan. Explica las medidas, cómo se nombran y
organizan los archivos, qué dibujos ya tenemos y cuáles faltan.

## 1. Medidas del juego

| Elemento           | Medida       | Nota                                           |
| ------------------ | ------------ | ---------------------------------------------- |
| Pantalla del juego | 800×640 px   | Una sala completa por pantalla                 |
| Sala               | 800×640 px   | 25×20 casillas de 32 px                        |
| Mapa de un nivel   | 2400×1920 px | 3×3 salas                                      |
| Cuadro del jugador | 32×48 px     | Confirmado: los dibujos recibidos son de 32×48 |
| Cuadro del enemigo | 32×48 px     | Confirmado                                     |
| Pieza del tileset  | 32×48 px     | Ver las preguntas pendientes (sección 7)       |

> **Los sprites se dibujan y pintan en ibisPaint X**, y se entregan "ampliados ×5". El editor exportó cada cuadro de
> 32×48 como una imagen de 160×240 (cada píxel dibujado es un cuadro de 5×5). Está bien para
> trabajar, pero el juego usa el tamaño real de 32×48. Se comprobó que la reducción es **exacta**,
> sin pérdida. Cómo se hace: [`arte/README.md`](../arte/README.md).

## 2. Dónde está cada cosa

```
arte/
  originales/            Lo que entrega quien dibuja, ampliado ×5 y con nombres estándar
    jugador/  enemigos/  escenario/
public/assets/
  img/                   Lo que carga el juego: hojas de sprites a tamaño real
    jugador/jugador.png
    enemigos/enemigo-debil.png
    enemigos/jefe-2.png
    escenario/tileset-prision.png
  audio/                 Sonidos y música
```

`arte/` no se publica con el juego; `public/` sí.

## 3. Cómo se nombran los archivos

- Todo en **minúsculas, con guiones y en español**, sin tildes ni espacios: `jugador-abajo-paso-1.png`.
- Orden del nombre, de lo general a lo particular: **`quién-dirección-acción-número`**.
  Ejemplos: `jugador-derecha-quieto.png`, `enemigo-debil-caminar-2.png`.
- Las direcciones son siempre `abajo`, `derecha`, `izquierda` y `arriba`.
- Las piezas del tileset llevan un número de dos cifras al principio (`09-textura-rayas-marron.png`).
  Ese número, menos 1, es su número de cuadro en la hoja.

## 4. Las hojas de sprites que ya tenemos

Una **hoja** junta varios cuadros del mismo tamaño en una sola imagen. Se cuentan de izquierda a
derecha y de arriba abajo, empezando en 0.

### Jugador — `jugador.png` (96×192, 12 cuadros)

| Fila      | Cuadros | Quieto | Paso 1 | Paso 2 |
| --------- | ------- | ------ | ------ | ------ |
| Abajo     | 0 – 2   | 0      | 1      | 2      |
| Derecha   | 3 – 5   | 3      | 4      | 5      |
| Izquierda | 6 – 8   | 6      | 7      | 8      |
| Arriba    | 9 – 11  | 9      | 10     | 11     |

La animación de caminar es **quieto, paso 1, quieto, paso 2**. Los cuadros de la izquierda son
**espejos exactos** de los de la derecha (y el paso 2 de frente es el espejo del paso 1), así que a
quien dibuja le basta con dibujar un lado.

El jugador **mira hacia donde apunta el ratón** (porque hacia ahí dispara) y camina con la
animación de esa dirección.

### Enemigo débil — `enemigo-debil.png` (64×48, 2 cuadros)

| Cuadro | Qué es            |
| ------ | ----------------- |
| 0      | Caminar, cuadro 1 |
| 1      | Caminar, cuadro 2 |

### Jefe 2 — `jefe-2.png` (96×32, 3 cuadros)

Un fantasma con corona. Los cuadros miden **32×32**, no 32×48 como los demás personajes.

| Cuadro | Qué es                                    |
| ------ | ----------------------------------------- |
| 0      | Flotar: manos abajo, a los lados          |
| 1      | Flotar: manos más cerca del cuerpo        |
| 2      | Flotar: manos arriba y la barba más corta |

La animación de flotar es **0, 1, 2, 1** (`jefe-2-flotar`), a 4 cuadros por segundo. En el juego se
muestra **ampliado ×3** (96×96 px). Hoy solo se ve, flotando en la sala del centro; **provisional:** se
usa en el piso 1 hasta que exista el dibujo del jefe del primer piso (`CONFIG.JEFE.CLAVE`).
Lo dibujó `CSebastianFO` (PR #14, que lo llamó `boss-p2.png`; se renombró según la guía de nombres).

### Tileset de la prisión — `tileset-prision.png` (256×144, 22 piezas en 8×3)

Los **nombres describen lo que se ve** en cada pieza y son provisionales hasta confirmar con quien
las dibujó para qué sirve cada una.

| Cuadro | Nombre                         | Cuadro | Nombre                       |
| ------ | ------------------------------ | ------ | ---------------------------- |
| 0      | marco-esquina-arriba-izquierda | 11     | panel-concentrico            |
| 1      | marco-esquina-arriba-derecha   | 12     | suelo-borde-abajo-derecha    |
| 2      | marco-esquina-abajo-derecha    | 13     | suelo-borde-abajo-izquierda  |
| 3      | marco-esquina-abajo-izquierda  | 14     | suelo-borde-arriba-izquierda |
| 4      | marco-borde-arriba             | 15     | suelo-borde-arriba-derecha   |
| 5      | marco-borde-abajo              | 16     | suelo-borde-arriba           |
| 6      | marco-borde-izquierda          | 17     | suelo-borde-abajo            |
| 7      | marco-borde-derecha            | 18     | suelo-borde-izquierda        |
| 8      | textura-rayas-marron           | 19     | suelo-borde-derecha          |
| 9      | textura-ranuras                | 20     | suelo-liso                   |
| 10     | panel-marco                    | 21     | suelo-rayas                  |

Las 8 piezas `marco-*` encajan entre sí formando un marco de bandas concéntricas (se comprobó
armándolas). Los números de cuadro también están en `FOTOGRAMAS_TILESET`, en
`src/datos/recursos.js`. **Hoy el juego usa dos:** `suelo-rayas` para el suelo y
`textura-rayas-marron` para las paredes.

## 5. Formato de los dibujos finales

- **PNG con fondo transparente**, sin suavizado (_pixel art_ nítido).
- Todos los cuadros de una hoja miden lo mismo.
- Fondos: un PNG de **2400×1920 px** por piso (cuando se decida cómo se arman).
- Audio: **.ogg** o **.mp3** cortos para efectos, y música en bucle.
- Para agregar o cambiar un dibujo: poner el archivo en `public/assets/img/` y cambiar su entrada en
  `src/datos/recursos.js`. El resto del juego no cambia, porque usa siempre la clave y no la ruta.

## 6. Qué recursos hacen falta

| Recurso                      | Estado      | Detalle                                                                      |
| ---------------------------- | ----------- | ---------------------------------------------------------------------------- |
| Jugador                      | **Hecho**   | 4 direcciones, quieto y caminar. Faltan: recibir daño, morir                 |
| Enemigo débil                | **Parcial** | Solo 2 cuadros de caminar. Faltan: recibir daño, morir                       |
| Suelo y paredes del piso 1   | **Parcial** | Hay tileset; falta decidir cómo se arma la sala (sección 7)                  |
| Bala                         | Provisional | Una imagen pequeña                                                           |
| Granada                      | Provisional | Una imagen pequeña (12×12 px); la explosión se dibuja por código             |
| Cofre                        | Provisional | Cerrado y abierto                                                            |
| Cajas (obstáculos)           | Provisional | 64×64 px                                                                     |
| Corazones del HUD            | Provisional | Lleno y vacío                                                                |
| Puerta                       | Pendiente   | Abierta, cerrada y con llave                                                 |
| Jefe 2 (el del segundo piso) | **Parcial** | Solo 3 cuadros de flotar. Faltan: ataque básico, ataque fuerte, recibir daño |
| Jefe 1 (el del primer piso)  | Pendiente   | Todo: flotar o quieto, ataque básico, ataque fuerte                          |
| Llave y mejoras              | Pendiente   | Iconos para el HUD                                                           |
| Portada                      | Pendiente   | Imagen de título                                                             |
| Piso 2                       | Pendiente   | Por definir                                                                  |
| Sonidos y música             | Pendiente   | Disparo, golpe, cofre, puerta, acierto, fallo, aviso del jefe                |

"Provisional" quiere decir que el código dibuja un rectángulo de colores mientras no exista el
dibujo final (ver `src/datos/recursos.js`).

## 7. Preguntas pendientes para quien dibuja

1. **¿Para qué sirve cada pieza del tileset?** Los nombres de la sección 4 son por lo que se ve.
2. **Las piezas miden 32×48, pero la sala mide 640 de alto.** 640 ÷ 48 no es un número entero
   (13,3), y 640 ÷ 32 sí (20). ¿Se piensa armar la sala con casillas de 32×48 o de 32×32?
3. **¿Qué es el enemigo?** Parece una criatura oscura con garras (¿una rata, un murciélago…?). El
   nombre actual, `enemigo-debil`, es por su función en el juego.
4. **Faltan cuadros** de recibir daño y de morir, para el jugador y el enemigo.
5. **¿Se puede entregar la hoja ya armada** (en vez de cuadros sueltos ampliados ×5)? Y avisar el
   tamaño de un cuadro. Así no hay que reducir ni armar nada a mano.
