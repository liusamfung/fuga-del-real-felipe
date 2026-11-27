# Enemigos

Hoy hay **7 tipos** de enemigo: el débil de siempre, **4 ratas** (nivel 1) y **2 guardias** (nivel 2); los dibujos
son de Jorge. El débil y las ratas hacen lo mismo, **caminar en línea recta hacia el jugador**, y lo que los
distingue es su **vida, velocidad y daño** y **cuántos hay en cada sala**; además, en el nivel 1 **cada sala tiene un
nido** que suelta más ratas hasta que se rompe. Los **guardias** son distintos: **disparan** (ver más abajo).
Los valores están en [`src/datos/enemigos.js`](../src/datos/enemigos.js) y [`src/config.js`](../src/config.js) y
son **provisionales**: se ajustan jugando.

## Los tipos

| Tipo          | Se ve como       | Vida | Velocidad | Daño                 | Su carácter                                                                               |
| ------------- | ---------------- | ---- | --------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `debil`       | El de siempre    | 3    | 70 px/s   | 1                    | Equilibrado. Se usa poco, como una variante más.                                          |
| `rata-gris`   | Rata gris        | 1    | 70 px/s   | **2**                | **La plaga:** una bala basta, viene en manada (y el nido suelta más), cada mordida duele. |
| `rata-blanca` | Rata blanca      | 2    | 160 px/s  | 1                    | **La veloz:** más del doble de rápida; dos balas la matan. Hay que apuntar rápido.        |
| `rata-azul`   | Rata azul oscura | 5    | 45 px/s   | 1                    | **La acorazada:** la más lenta; aguanta cinco balas. Se esquiva fácil y estorba mucho.    |
| `rata-negra`  | Rata negra       | 10   | 100 px/s  | **mata de un toque** | **La cazadora:** aguanta diez balas y no se la puede dejar acercar. Hay pocas.            |

Para comparar: el jugador camina a **220 px/s**, empieza con **3 corazones** y su bala quita **1** de vida (la
granada, 3). Ninguna rata es más rápida que el jugador: siempre se puede huir.

**Golpe mortal:** la rata negra le quita al jugador **infinito**, así que lo mata de un toque aunque haya
corazones extra de cofre (el jugador resta `vida - daño` y no baja de 0; el daño infinito supera cualquier extra). Cada una de las otras ratas quita 1 o
2 corazones. Después de un golpe, el jugador es inmune 1 segundo.

## Los guardias del nivel 2 _(27/11/2026)_

Los dibujos de Jorge muestran a dos guardias con arma. En vez de embestir, **mantienen una distancia, se detienen un
momento apuntando y disparan**. Los dos disparan **distinto** (era el pedido). El comportamiento está en
[`Tirador`](../src/sistemas/Tirador.js) (lógica pura, con pruebas) y los números en el campo `disparo` de cada tipo.

|                         | **Guardia azul** (`guardia-azul`)                                        | **Guardia rojo** (`guardia-rojo`)                                                          |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Papel                   | **El tirador**                                                           | **El escopetero**                                                                          |
| Vida / velocidad        | 3 / 60 px/s                                                              | **5** / 45 px/s                                                                            |
| Dónde se queda          | **Lejos**: entre 200 y 300 px del jugador (si te acercas, **retrocede**) | **Cerca**: avanza hasta 200 px y ahí se detiene                                            |
| Cómo dispara            | **Una bala** hacia ti                                                    | **Abanico de 3 balas** (26° entre una y otra, la del medio hacia ti)                       |
| Velocidad de la bala    | **300 px/s** (más rápida que tú, que caminas a 220)                      | 230 px/s                                                                                   |
| Ritmo                   | Cada 1,7 s                                                               | Cada 2,6 s                                                                                 |
| Aviso                   | 0,3 s (se detiene y **parpadea en rojo**)                                | **0,55 s**                                                                                 |
| Alcance                 | 480 px                                                                   | 340 px                                                                                     |
| Cómo se juega contra él | Moverse sin parar y rodear las cajas para acercársele                    | Esperar a que se detenga y esquivar **de lado**; el centro del abanico siempre va hacia ti |

- **Las balas** son del color del guardia (azul o roja), quitan **1 corazón**, se detienen en paredes, cajas y puertas
  cerradas, y desaparecen al salir de la sala y cuando la sala queda limpia. Las **cajas sirven de cobertura**.
- Cada guardia empieza a disparar con un retraso al azar (hasta 0,8–0,9 s más) para que los de una sala **no
  disparen todos a la vez**.
- Tocarlos también quita 1 corazón. El dibujo es **de frente** (sin direcciones, como las ratas) y tiene **3 cuadros**:
  de pie y dos pasos; al detenerse a apuntar se queda de pie.

### Las salas del nivel 2

Sin nidos; de **3 a 5 guardias** por sala y **ninguna mezcla repetida**. Las posiciones son las ya comprobadas del nivel 1.

| Sala  | Guardias           | Qué la hace distinta                                          |
| ----- | ------------------ | ------------------------------------------------------------- |
| (0,0) | 3 azules           | **Inicial:** la más suave; enseña a rodear las cajas.         |
| (1,0) | 1 rojo + 2 azules  | Un escopetero con un tirador a cada lado.                     |
| (2,0) | 2 rojos + 1 azul   | Dos abanicos entre los pilares.                               |
| (0,1) | 4 azules           | **Fuego cruzado:** uno en cada rincón, siempre en movimiento. |
| (2,1) | 1 rojo + 3 azules  | Muchas balas rápidas y un escopetero.                         |
| (0,2) | 2 rojos + 2 azules | ¿A cuál se rodea primero?                                     |
| (1,2) | 1 azul + 3 rojos   | **Sin cajas:** no hay dónde esconderse.                       |
| (2,2) | 3 rojos + 2 azules | **La más difícil.**                                           |

## El nido

Una de las cajas de cada sala es un **nido de ratas** (en la sala vacía hay una caja-nido de más). Se ve distinto
de una caja: paja, una boca oscura y ojos rojos.

- Es **sólido** como una caja: ni el jugador ni los enemigos lo atraviesan.
- Una vez que empieza el combate, **suelta una rata gris cada 4,5 s**, pegada al nido y hacia el interior de la
  sala. No suelta una nueva si ya hay **6 suyas vivas**, si no cabe ninguna junto al nido, o si el jugador está a
  menos de 100 px del lugar donde saldría (para que no aparezca encima de él).
- Tiene **10 de vida**. Las balas lo dañan y desaparecen al darle; la granada le quita 3. Cuando recibe su primer
  golpe se ve una barra de vida sobre él.
- **Hay que romperlo para limpiar la sala:** la sala queda limpia cuando **no quedan enemigos vivos Y el nido está
  roto**. Si se rompe cuando ya no queda ninguna rata, la sala se limpia al instante; si no, hay que acabar con las
  que quedan. Al romperse, el nido deja de soltar ratas.
- Se puede romper **antes** de que empiece el combate (si el jugador le dispara al entrar). Entonces la sala se
  limpia sola al acabar con las ratas.
- La cámara lenta del reto de la granada también estira el ritmo del nido (usa el reloj del juego).

## Qué hay en cada sala

Cada una de las 8 salas de alrededor tiene **su propia mezcla**, de 3 a 6 enemigos (antes había uno solo, el
débil), **y su nido**. La sala inicial es la más suave por vida total. Las posiciones están en
[`src/datos/niveles.js`](../src/datos/niveles.js).

| Sala  | Enemigos                                          | Vida total | Qué la hace distinta                                  |
| ----- | ------------------------------------------------- | ---------- | ----------------------------------------------------- |
| (0,0) | 3 ratas grises                                    | 3          | **Inicial:** la más suave, pero cada mordida quita 2. |
| (1,0) | 3 ratas blancas                                   | 6          | Rapidez: hay que apuntar enseguida.                   |
| (2,0) | 1 rata azul + 2 grises                            | 7          | Una que estorba y dos que se adelantan.               |
| (0,1) | 6 ratas grises                                    | 6          | **La plaga:** seis a la vez, y el nido suelta más.    |
| (2,1) | 1 rata negra + 2 blancas                          | 14         | **Peligro mortal:** la negra mata de un toque.        |
| (0,2) | 2 ratas azules + 2 blancas                        | 14         | ¿A quién se dispara primero?                          |
| (1,2) | 1 débil + 1 rata negra + 2 grises                 | 15         | Mezcla con el enemigo de siempre y una negra.         |
| (2,2) | 1 rata de cada color (gris, azul, blanca y negra) | 18         | **La más difícil:** de todo un poco.                  |

Hay **como máximo una rata negra por sala** (con 10 vidas y golpe mortal, dos juntas serían injustas). La sala
del jefe (el centro) no tiene enemigos ni nido. El **orden** en que se recorren las salas no está fijo (depende del
jugador y de dónde salga la llave), así que la dificultad no sube en línea recta.

## Reglas que comprueban las pruebas

Para el **nivel 2** (`pruebas/nivel2.test.js`, `pruebas/tirador.test.js` y `pruebas/enemigos.test.js`): solo hay
guardias, 3–5 por sala, sin nido y sin mezclas repetidas; nacen a 200 px o más de las puertas; los dos guardias
**disparan distinto** (patrón, ritmo, aviso, distancia y vida); el alcance de cada uno llega hasta donde se queda; y el
`Tirador` se acerca, se aleja, apunta y dispara en los instantes exactos (bordes incluidos). Para el **nivel 1**:

`pruebas/generadorDeNivel.test.js`, `pruebas/enemigos.test.js` y `pruebas/nido.test.js` comprueban que:

- Cada sala de combate tiene de **3 a 6** enemigos y un **nido**, y **ninguna repite** la mezcla de otra.
- Todo enemigo nace **dentro de las paredes**, a **200 px o más de cualquier puerta** (el jugador entra por
  una), **sin pisar un obstáculo, el nido, el cofre ni a otro enemigo**. El nido no pisa ninguna caja ni bloquea
  las cruces por donde se va de una puerta a otra.
- De **cada nido puede salir una rata** (siempre hay un lado libre) sin pisar una caja ni una pared, y prefiere
  salir hacia el centro de la sala.
- Cada rata es fiel a su carácter: la **gris** es la más frágil, va a velocidad normal y quita 2; la **blanca** es la
  más veloz (al menos el doble que la gris) y tiene 2 vidas; la **azul** es la más lenta; la **negra** tiene 10 vidas
  y es la única letal.
- Hay una sala con **5 o más ratas grises**, **todos los tipos aparecen** en alguna sala y ninguna rata alcanza al
  jugador.

## Cómo agregar o cambiar un tipo

1. Dibuja 2 cuadros de caminar (32×48; 3 los guardias) y arma la hoja (`arte/README.md`); agrégala a `src/datos/recursos.js`.
2. Crea su animación en `src/datos/animaciones.js` (`<nombre>-caminar`, cuadros `[0, 1]`).
3. Agrega su entrada en `src/datos/enemigos.js` con su vida, velocidad y daño (o `letal: true` en vez de `dano`). Si
   debe **disparar**, agrégale el campo `disparo` (explicado al principio del archivo).
4. Úsalo en una sala de `src/datos/niveles.js` con `enemigo('<tipo>', x, y)`. Las pruebas te dicen si la posición
   es válida. Para cambiar qué caja de una sala es el nido: `...conNido(OBSTACULOS.<disposición>, x, y)`.

## Pendiente

- Las ratas siguen sin cambiar de comportamiento (solo persiguen); solo los guardias disparan. Falta decidir si
  alguna rata debe hacer algo distinto (ver [`decisiones-pendientes.md`](decisiones-pendientes.md)).
- **Los guardias están sin ajustar:** vida, ritmo, velocidad de las balas y número por sala son una primera estimación
  mía (el 27/11/2026) y no se han jugado de principio a fin. Las balas (10 px) y su dibujo son provisionales.
- Los guardias solo tienen dibujo **de frente**, sin dibujo de disparar, de recibir daño ni de morir.
- **El nido es nuevo y está sin ajustar:** su vida (10), el ritmo (4,5 s) y el máximo de ratas vivas (6) son una
  primera estimación. Con una plaga de seis ratas que muerden por 2, puede resultar muy duro: hay que jugarlo.
- Faltan los dibujos de **recibir daño** y **morir**, y el dibujo final del **nido** (hoy es provisional, hecho
  por código).
