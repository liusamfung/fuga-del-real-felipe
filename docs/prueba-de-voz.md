# Prueba de voz (el _spike_ del paso 8)

Hay que averiguar **qué tan bien reconoce el navegador a alguien deletreando en español**, antes de
construir el jefe y los poderes encima. Esta prueba la hace **una persona hablando**: ningún programa
puede hacerla por ti.

## Qué necesitas

- **Chrome** (o Edge). Firefox no tiene reconocimiento de voz.
- **Internet:** Chrome manda el audio a un servidor para reconocerlo.
- Un **micrófono** y un lugar sin mucho ruido. Cuanto más parecido al lugar donde se jugará, mejor.
- El juego abierto desde `localhost` (con `npm run dev`).

## Cómo hacerla

1. Abre **http://localhost:5173/?voz**. Aparece la pantalla de prueba, no el juego.
2. Pulsa **ENTER**. La primera vez, Chrome pide **permiso para el micrófono**: acepta. Arriba debe
   decir `● ESCUCHANDO`.
3. **Deletrea la palabra** que aparece, diciendo el nombre de cada letra **con una pequeña pausa
   entre una y otra**: _efe… e… ere… ere… o…_ Si las dices muy seguidas, Chrome las junta en una
   palabra («calllao») y no se entienden (ver _Primera ronda_, abajo).
4. Mira en pantalla:
   - **Lo que oyó el navegador:** el texto tal cual, con su porcentaje de confianza.
   - **Letras que entendí:** las letras que el juego saca de ese texto. Las que van entre paréntesis
     son errores.
   - **No son letras:** lo que el navegador escribió que no es el nombre de una letra (por ejemplo,
     la palabra entera).
5. Cuando termines, pulsa **ENTER** para parar y **espera a que diga «Parado»**: Chrome entrega
   lo último que oyó justo al cerrar. Recién entonces pulsa **BACKSPACE** para repetir la palabra o
   **ESPACIO** para pasar a otra. Cada intento queda **anotado** con su palabra. (Si pasas a otra palabra
   con el micrófono abierto, se corta y lo que llegue tarde se descarta.)
6. Prueba también **al revés** (tecla **R**).
7. Al final pulsa **C**: copia todos los intentos como JSON al portapapeles. Pégalos en un archivo o
   en el chat. (Si no se puede copiar, el JSON queda en la consola del navegador.) El JSON incluye
   `eventos`: todo lo que mandó Chrome, con su tiempo, para poder reproducirlo sin volver a hablar.

| Tecla     | Qué hace                                                                 |
| --------- | ------------------------------------------------------------------------ |
| ENTER     | Empezar o parar de escuchar                                              |
| ESPACIO   | Pasar a otra palabra                                                     |
| BACKSPACE | Repetir la palabra (anota el intento)                                    |
| R         | Cambiar entre al derecho y al revés                                      |
| C         | Copiar los intentos al portapapeles                                      |
| 0         | Volver a la primera palabra (al derecho); no borra los intentos anotados |
| P         | Sesgar el reconocimiento hacia los nombres de las letras (solo con L)    |
| L         | Reconocer en el equipo, sin servidor (descarga el idioma la primera vez) |

**P y L son experimentos** contra las letras que Chrome junta en palabras. En el Chrome de la
herramienta de desarrollo, el sesgo (`phrases`) lo **rechaza** si el reconocimiento es en el servidor
(`phrases-not-supported`), y el reconocimiento en el equipo salió `unavailable` para `es-PE` y
`es-ES`; en tu Chrome puede ser distinto. Si **L** dice que no se puede, no pasa nada: sigue en el
servidor. Si funciona, repite **las mismas 3 palabras** en las 3 configuraciones (normal, solo L, L + P)
y compara.

## Qué probar

Lo ideal es **5 personas** y **5 palabras** cada una (cortas y largas, con _ñ_, _rr_, _b/v_ y _h_):

- Cortas: **RODIL**, **CALLAO**, **FUERTE**.
- Con ñ: **CAÑÓN**.
- Largas: **FORTALEZA**, **INDEPENDENCIA**, **FERROCARRIL**.
- Al menos una palabra **al revés**.
- Si se puede, probar también con **es-ES** en vez de **es-PE** (se cambia en `src/config.js`,
  `DELETREO.VOZ.IDIOMA`) y comparar.

## Qué anotar

Para cada persona: el navegador, el idioma, si hablaron con acento marcado, y para cada palabra:

| Persona | Palabra | Letras acertadas | Errores | Tiempo (s) | ¿Completa? | Qué falló |
| ------- | ------- | ---------------- | ------- | ---------- | ---------- | --------- |
|         |         |                  |         |            |            |           |

El JSON que copia la tecla **C** ya trae todo esto (`aciertos`, `errores`, `completa`,
`msHastaLaUltima`, `entendidas`, `oido`, `noEntendidas`).

## Cómo se decide con los resultados

Estos umbrales son una **propuesta**, no una regla:

| Letras acertadas  | Qué hacer                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| 80 % o más        | La voz sirve. Se ajusta la tabla de nombres y el tiempo.                                               |
| Entre 60 % y 80 % | Sirve con ayudas: más errores perdonados, más tiempo, palabras más cortas.                             |
| Menos de 60 %     | Hay que **cambiar el diseño** (por ejemplo, decir palabras cortas en vez de deletrear) antes del jefe. |

Con los resultados se ajusta:

1. **La tabla de nombres** (`src/datos/nombresDeLetras.js`): cada vez que el navegador escribe una
   letra de una forma que no conocemos (aparece en _Lo que oyó_ pero no como letra), se agrega.
2. **El tiempo por letra y el factor de la voz** (`src/config.js`: `DELETREO.TECLADO` y
   `DELETREO.VOZ.FACTOR_DE_TIEMPO`). Hoy la voz da 50 % más que el teclado _(provisional)_. Se mide con
   `msHastaLaUltima ÷ letras`.
3. **El idioma** (`es-PE` o `es-ES`): el que dé más aciertos.
4. **`RETENER_ULTIMA`**: hoy apagado (en la segunda ronda, retener la última letra costó ~1,3 s por
   palabra y casi no evitó errores).

## Primera ronda (una persona, 10 intentos)

**Los números de esa ronda se calcularon de nuevo.** La pantalla de prueba anotaba cada intento con la
palabra _siguiente_ (un fallo, ya arreglado), y la persona deletreaba tal como indicaba el protocolo de
entonces («a tu ritmo natural»). Con las palabras que se dijeron de verdad, usando solo el texto final
que mandó Chrome:

| Dijo (al derecho salvo indicación) | Chrome escribió     | Letras                       |
| ---------------------------------- | ------------------- | ---------------------------- |
| FUERTE                             | `F u e r t e`       | 6/6                          |
| FORTALEZA (al revés)               | `a Z e l a t r o F` | 9/9                          |
| PÓLVORA (al revés)                 | `a r o b l o p`     | 7/7 (la B vale como V)       |
| FORTALEZA                          | `f o r d a l e Z a` | 8/9 (oyó «de» por «te»)      |
| RODIL                              | `r o d IL`          | 3/5 («il» junta la I y la L) |
| CALLAO                             | `calllao`           | 0/6 (la palabra entera)      |
| CAÑÓN                              | `cañ o n`           | 0/5 («cañ» junta C, A y Ñ)   |
| ASEDIO                             | `asedio`            | 0/6 (la palabra entera)      |
| BASTIÓN (al revés)                 | `noi tsab`          | 0/7 (dos pseudo-palabras)    |
| CAPITULACIÓN                       | `a c i o n`         | 0/12 (solo oyó el final)     |

**Lo que se aprende:**

1. Cuando las letras salen **separadas**, Chrome acierta casi todo: **30 de 31** en los cuatro
   intentos limpios (96 %).
2. Cuando se dicen **seguidas**, Chrome las junta en una palabra y se pierden. Es el problema principal,
   y es del reconocedor, no de la tabla de nombres.
3. Esas palabras juntadas **no cuentan** (decir la palabra entera no la completa), y está bien así: si
   contaran, se podría hacer trampa diciendo «asedio».
4. «de» por «te» es un malentendido real. Pendiente de decidir si se perdona (ver
   [`decisiones-pendientes.md`](decisiones-pendientes.md)).
5. Falta repetir la ronda con la pausa entre letras, con más personas y con el JSON nuevo (`eventos`).

## Segunda ronda (una persona, 35 intentos)

Dos tandas: **19 intentos con el servidor** (lo normal) y **16 con el reconocimiento en el equipo**
(tecla `L`; 6 sin sesgo y 10 con sesgo `P`). No se hizo con las mismas palabras en cada tanda, así que
solo se puede comparar en conjunto.

**Hallazgo principal: un fallo mío.** El flujo crudo (`eventos`) mostró que Chrome reparte lo que
oye entre varios resultados a la vez («r o d» en el resultado 0 y «i l» en el 1, y luego el 0 se come
al 1). El acumulador contaba cada resultado por separado y sacaba letras de más y desordenadas
(`R O (I) D I L`). Se arregló uniendo todos los resultados en un solo texto. Reproduciendo los
eventos grabados con el código nuevo:

| Servidor (19 intentos)             | Antes         | Después        |
| ---------------------------------- | ------------- | -------------- |
| Letras acertadas                   | 83/148 (56 %) | 104/148 (70 %) |
| Palabras completas con ≤ 2 errores | 9 de 19       | **13 de 19**   |
| Errores sueltos                    | 41            | 13             |

(El reproductor imita exactamente los resultados grabados con el código viejo: 83/148 y 10 completas.)
Además se leen como dos letras las palabras de dos caracteres que son letras pegadas («fu», «il»,
«fe») y se añadió «sí» como C.

**Lo que sigue fallando, todo en el servidor** (6 de 19): Chrome junta letras en una palabra, sobre
todo con **«ce a»** («cañña», «Canon», «call lao», «capitula») y se pierde una **L** en PÓLVORA. Las
palabras largas sin ese comienzo salieron bien: INDEPENDENCIA, ARTILLERÍA y FERROCARRIL completas y
sin errores.

**Reconocer en el equipo (L): no ayuda.** 62 % de las letras y 6 de 16 palabras, peor que el servidor.
Cuando acierta no se equivoca, pero a menudo **no oye la última letra** («F u e R T» por FUERTE,
«C a l l a» por CALLAO) y corta el resultado a la mitad («F o R» y luego «a l e Z a»). El sesgo (`P`) no
mostró ventaja visible (4 de 10 palabras con sesgo contra 2 de 6 sin él, con palabras distintas).
**Recomendación: seguir con el servidor.** Las teclas L y P se quedan como experimento.

**«de» por «te»:** no se repitió en 35 intentos. Se deja como está (la D no vale por la T).

**Tiempo.** Con pausas entre letras, el tiempo desde la primera letra hasta la última fue de unos
**0,7 a 0,85 s por letra** (FORTALEZA 7,0–7,7 s, INDEPENDENCIA 11 s, ARTILLERÍA 7,4 s). El tiempo actual
(teclado × 1,5) da 0,6 s por letra: **se queda corto en las palabras largas** (INDEPENDENCIA tiene
10 s y necesitó 11 más el tiempo de empezar). Con un factor de **2** alcanza.

## Cosas que ya sabemos

- **B y V suenan igual.** Ningún reconocedor las distingue, así que "be" y "ve" valen para las dos.
  Solo se distinguen si se dice _be larga_ o _ve corta_ / _uve_.
- Si el navegador junta las letras en una **palabra** (_efe e ere_ → «fer»), esa palabra **no
  cuenta**: se ignora y queda en _No son letras_. Pasó en la primera ronda cuando se hablaba seguido:
  hay que hablar **con pausas** (o encontrar una ayuda: P y L).
- Chrome **corta** el reconocimiento tras un silencio. El juego lo **reinicia solo** mientras se
  deletrea.
- Si el micrófono no funciona (sin permiso, sin internet, sin soporte), el deletreo **pasa solo al
  teclado** y lo avisa en pantalla: el juego nunca se queda sin forma de deletrear.

## Probar la voz dentro del juego

En el juego, la tecla **V** cambia entre deletrear con el **teclado** y con la **voz** _(provisional,
hasta el paso 9)_. Después, **E**, **T** e **Y** piden la palabra como siempre (ver
[`mecanicas.md`](mecanicas.md) 5.7 y 5.8). Con la voz, el tiempo es 50 % mayor y el teclado se
desactiva mientras el micrófono esté activo.
