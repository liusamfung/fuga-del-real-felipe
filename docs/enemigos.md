# Enemigos

Hoy hay **5 tipos** de enemigo: el débil de siempre y **4 ratas** (los dibujos son de Jorge). Todos hacen lo
mismo, **caminar en línea recta hacia el jugador**, y lo que los distingue es su **vida, velocidad y daño**
y **cuántos hay en cada sala**. Los valores están en [`src/datos/enemigos.js`](../src/datos/enemigos.js) y son
**provisionales**: se ajustan jugando.

## Los tipos

| Tipo          | Se ve como       | Vida | Velocidad | Daño | Su carácter                                                                           |
| ------------- | ---------------- | ---- | --------- | ---- | ------------------------------------------------------------------------------------- |
| `debil`       | El de siempre    | 3    | 70 px/s   | 1    | Equilibrado. Se usa poco, como una variante más.                                      |
| `rata-gris`   | Rata gris        | 1    | 70 px/s   | 1    | **La plaga:** frágil y de velocidad normal, pero viene en manada (hasta 6).           |
| `rata-blanca` | Rata blanca      | 1    | 160 px/s  | 1    | **La veloz:** más del doble de rápida; cae con una bala, pero hay que apuntar rápido. |
| `rata-azul`   | Rata azul oscura | 5    | 45 px/s   | 1    | **La acorazada:** lenta, aguanta cinco balas. Se esquiva fácil y estorba mucho.       |
| `rata-negra`  | Rata negra       | 3    | 100 px/s  | 2    | **La mordedora:** rápida y su mordida quita 2 de las 3 vidas del jugador.             |

Para comparar: el jugador camina a **220 px/s**, empieza con **3 vidas** y su bala quita **1** de vida (la
granada, 3). Ninguna rata es más rápida que el jugador: siempre se puede huir.

## Qué hay en cada sala

Cada una de las 8 salas de alrededor tiene **su propia mezcla**, de 3 a 6 enemigos (antes había uno solo, el
débil). La sala inicial es la más suave. Las posiciones de aparición están en
[`src/datos/niveles.js`](../src/datos/niveles.js).

| Sala  | Enemigos                                          | Vida total | Qué la hace distinta                          |
| ----- | ------------------------------------------------- | ---------- | --------------------------------------------- |
| (0,0) | 3 ratas grises                                    | 3          | **Inicial:** para empezar sin sustos.         |
| (1,0) | 3 ratas blancas                                   | 3          | Rapidez: hay que apuntar enseguida.           |
| (2,0) | 1 rata azul + 2 grises                            | 7          | Una que estorba y dos que se adelantan.       |
| (0,1) | 6 ratas grises                                    | 6          | **La plaga:** seis a la vez.                  |
| (2,1) | 2 ratas negras + 1 blanca                         | 7          | Daño: un descuido con las negras cuesta caro. |
| (0,2) | 2 ratas azules + 2 blancas                        | 12         | ¿A quién se dispara primero?                  |
| (1,2) | 1 débil + 1 rata negra + 2 grises                 | 8          | Mezcla con el enemigo de siempre.             |
| (2,2) | 1 rata de cada color (gris, azul, blanca y negra) | 10         | **La más difícil:** de todo un poco.          |

La sala del jefe (el centro) no tiene enemigos. El **orden** en que se recorren las salas no está fijo
(depende del jugador y de dónde salga la llave), así que la dificultad no sube en línea recta.

## Reglas que comprueban las pruebas

`pruebas/generadorDeNivel.test.js` y `pruebas/enemigos.test.js` comprueban que:

- Cada sala de combate tiene de **3 a 6** enemigos y **ninguna repite** la mezcla de otra.
- Todo enemigo nace **dentro de las paredes**, a **200 px o más de cualquier puerta** (el jugador entra por
  una), **sin pisar un obstáculo, el cofre ni a otro enemigo**.
- Cada rata es fiel a su carácter: la blanca es la más veloz (al menos el doble que la gris), la azul la más
  lenta y resistente, la negra la que más daño hace, y la gris la más frágil y de velocidad normal.
- Hay una sala con **5 o más ratas grises**, **todos los tipos aparecen** en alguna sala y ninguna rata
  alcanza al jugador.

## Cómo agregar o cambiar un tipo

1. Dibuja 2 cuadros de caminar (32×48) y arma la hoja (`arte/README.md`); agrégala a `src/datos/recursos.js`.
2. Crea su animación en `src/datos/animaciones.js` (`<nombre>-caminar`, cuadros `[0, 1]`).
3. Agrega su entrada en `src/datos/enemigos.js` con su vida, velocidad y daño.
4. Úsalo en una sala de `src/datos/niveles.js` con `enemigo('<tipo>', x, y)`. Las pruebas te dicen si la posición
   es válida.

## Pendiente

- Hoy ninguno **dispara** ni cambia de comportamiento: solo persiguen. Falta decidir si algún tipo debe hacer
  algo distinto (ver [`decisiones-pendientes.md`](decisiones-pendientes.md)).
- Faltan los dibujos de **recibir daño** y **morir**.
