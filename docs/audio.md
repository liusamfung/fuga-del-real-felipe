# Audio: música y efectos de sonido

Hay **10 sonidos** (2 músicas y 8 efectos) en [`public/assets/audio/`](../public/assets/audio/). Son **sonidos propios,
sintetizados por código** (nada copiado de internet, así que no hay derechos de autor que revisar). Son **provisionales**:
suenan bien para jugar y probar, pero si alguien graba o consigue uno mejor, se cambia sin tocar el código (ver más abajo).

> Los generé y comprobé con medidas (duración, volumen, espectrogramas, que el bucle no dé un salto), **pero no pude
> oírlos**: hay que escucharlos jugando y decir si alguno molesta, es muy fuerte o no encaja.

## Qué suena y cuándo

| Archivo                        | Qué es                                                                      | Dura           | Cuándo suena                                                                    |
| ------------------------------ | --------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `musica-nivel-1.mp3`           | Música del nivel 1 (la menor, 92 pulsos, oscura y lenta)                    | 83 s, en bucle | Al empezar el nivel 1 (con la primera tecla que se pulse)                       |
| `musica-nivel-2.mp3`           | Música del nivel 2 (re menor, 120 pulsos, más tensa, con golpes de barrote) | 64 s, en bucle | Al empezar el nivel 2                                                           |
| `jugador-disparo.mp3`          | Disparo del jugador: un «pew» corto                                         | 0,16 s         | Cada bala del jugador                                                           |
| `jugador-dano.mp3`             | El jugador recibe daño: un quejido con golpe grave                          | 0,55 s         | Cada vez que pierde vida (también el rayo del jefe)                             |
| `guardia-rifle-disparo.mp3`    | Rifle del guardia azul (el tirador): chasquido seco con eco                 | 0,65 s         | Cada disparo del guardia azul                                                   |
| `guardia-escopeta-disparo.mp3` | Escopeta del guardia rojo (el escopetero): estallido pesado y grave         | 0,9 s          | Cada abanico del guardia rojo (un sonido por abanico)                           |
| `rata-ataque.mp3`              | Ataque de las ratas: dos chillidos con un mordisco                          | 0,36 s         | Cuando una rata toca al jugador                                                 |
| `fantasma-ataque-basico.mp3`   | Jefe fantasma, ataque básico: un lamento con eco                            | 1,0 s          | Cada ataque básico del jefe (uno por ataque, también en la ráfaga)              |
| `fantasma-ataque-fuerte.mp3`   | Jefe fantasma, ataque fuerte: el rayo, un barrido grave con chisporroteo    | 2,3 s          | **Justo cuando se abre el rayo** (también si el jugador lo esquiva con el dash) |

Las duraciones cumplen la lista que se pidió (música de 1 a 2 min; efectos de menos de 0,5 s, 1 s o 1,5 s; el rayo de 1 a 3 s) y
una prueba lo comprueba leyendo los propios archivos MP3.

## Cómo suenan en el juego

- **Tecla `M`:** silencia o devuelve todo el sonido. Se **recuerda** para la próxima vez (en el navegador). En el dictado
  (donde se teclean palabras) la `M` es una letra más y **no** silencia.
- **La música empieza con la primera tecla o clic**: los navegadores no dejan sonar nada antes. El juego guarda lo que se pide
  y lo reproduce en cuanto se desbloquea.
- **En cámara lenta la música baja de ritmo y de tono** (a 0,55×) como una cinta que se frena, y vuelve al terminar el reto.
- **Los efectos no se repiten demasiado seguido** (`separacion` en el catálogo): una rata encima del jugador choca 60 veces por
  segundo, pero solo suena a mordiscos cada 0,35 s. En una prueba con tres ratas, 156 choques en 6 s sonaron 7 veces.
- **Cada vez cambian un poquito de tono** (`variacion`), para que dos disparos seguidos no suenen idénticos.
- **Cuando aparece el dictado** (el reto difícil del jefe 2, en que una voz dice la palabra en inglés y se escribe), **el volumen del
  juego baja a un 12 %** con suavidad (0,3 s), para poder oír bien la palabra, y vuelve a subir al cerrarse el cartel del resultado. La
  voz que dice la palabra no se toca. El valor es `AUDIO.VOLUMEN_EN_EL_DICTADO` en `src/config.js`.
- **La música va más baja que los efectos** (volumen 0,3 contra 0,35 a 0,8) para que disparos y golpes se oigan encima.

## Dónde está cada cosa en el código

| Qué                                                          | Dónde                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Catálogo (volumen, separación, variación, duración esperada) | [`src/datos/audio.js`](../src/datos/audio.js)                                                                        |
| Reproducir efectos y música, silencio, ritmo en cámara lenta | [`src/sistemas/Sonido.js`](../src/sistemas/Sonido.js)                                                                |
| Cuentas puras (separación, variación de tono, ritmo)         | [`src/utilidades/sonido.js`](../src/utilidades/sonido.js)                                                            |
| Qué sonido hace cada enemigo                                 | campos `sonidoDeAtaque` (ratas) y `disparo.sonido` (guardias) en [`src/datos/enemigos.js`](../src/datos/enemigos.js) |
| La herramienta que los genera                                | [`herramientas/generar-audio.js`](../herramientas/generar-audio.js)                                                  |

Los efectos se piden con `escena.sonido?.efecto('clave')` desde `Disparo`, `Jugador`, `Enemigo`, `RayoDelJefe` y `EscenaJuego`;
la música la arranca `EscenaJuego` según el número del nivel (`musica-nivel-<n>`).

## Cómo cambiar un sonido por uno mejor

1. Consigue o graba el sonido (propio, o con licencia libre: **anota de dónde sale** en este archivo) y pásalo a **MP3 mono a
   44100 Hz** con la **misma duración aproximada** (la prueba `pruebas/audio.test.js` comprueba formato y duración).
2. Ponlo en `public/assets/audio/` **con el mismo nombre**. No hay que tocar código.
3. Si queda muy fuerte o muy suave, ajusta su `volumen` en `src/datos/audio.js`.

## Cómo volver a generarlos

```bash
npm run audio                          # genera los 10
npm run audio -- rata-ataque           # solo el que se nombre
```

Necesita `ffmpeg` (`brew install ffmpeg`); los MP3 ya están en el repositorio, así que quien no toque los sonidos no lo necesita.
Siempre salen **exactamente iguales** (el ruido usa una semilla fija). Para cambiar cómo suena uno, se edita su función en
`herramientas/generar-audio.js`; la música son compases escritos a mano (acordes, melodía de ocho corcheas por compás, patrones de
bajo, arpegio y batería), fáciles de retocar.

## Limitaciones conocidas

- **No los oí yo:** la calidad real (si la música cansa, si algún efecto raspa) solo se juzga escuchando. Las melodías las compuse
  yo con reglas simples (menor, 4 secciones de 8 compases): cumplen, pero **no son música de compositor**.
- **El bucle de la música** se unió sin salto en la señal (0,6× y 0,1× de la variación normal), pero el formato MP3 puede dejar
  un silencio mínimo (unos 25 ms) al repetir. Si se nota, se pasa a `.ogg`.
- No hay música del jefe, de la portada ni de la pantalla final, ni sonidos de cofre, puerta, acierto/fallo del reto, muerte del
  enemigo, granada ni victoria: no estaban en la lista. Son fáciles de agregar con el mismo catálogo.
- No hay control de volumen, solo silenciar (`M`).
