# Enemigos

Hoy hay **5 tipos** de enemigo: el débil de siempre y **4 ratas** (los dibujos son de Jorge). Todos hacen lo
mismo, **caminar en línea recta hacia el jugador**, y lo que los distingue es su **vida, velocidad y daño**
y **cuántos hay en cada sala**. Además, **cada sala tiene un nido** que suelta más ratas hasta que se rompe.
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
mejorado su vida máxima (el jugador resta `vida - daño` y no baja de 0). Cada una de las otras ratas quita 1 o
2 corazones. Después de un golpe, el jugador es inmune 1 segundo.

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

1. Dibuja 2 cuadros de caminar (32×48) y arma la hoja (`arte/README.md`); agrégala a `src/datos/recursos.js`.
2. Crea su animación en `src/datos/animaciones.js` (`<nombre>-caminar`, cuadros `[0, 1]`).
3. Agrega su entrada en `src/datos/enemigos.js` con su vida, velocidad y daño (o `letal: true` en vez de `dano`).
4. Úsalo en una sala de `src/datos/niveles.js` con `enemigo('<tipo>', x, y)`. Las pruebas te dicen si la posición
   es válida. Para cambiar qué caja de una sala es el nido: `...conNido(OBSTACULOS.<disposición>, x, y)`.

## Pendiente

- Hoy ninguno **dispara** ni cambia de comportamiento: solo persiguen. Falta decidir si algún tipo debe hacer
  algo distinto (ver [`decisiones-pendientes.md`](decisiones-pendientes.md)).
- **El nido es nuevo y está sin ajustar:** su vida (10), el ritmo (4,5 s) y el máximo de ratas vivas (6) son una
  primera estimación. Con una plaga de seis ratas que muerden por 2, puede resultar muy duro: hay que jugarlo.
- Faltan los dibujos de **recibir daño** y **morir**, y el dibujo final del **nido** (hoy es provisional, hecho
  por código).
