# Prueba de voz en inglés

El juego va a enseñar inglés (ver el cambio de enfoque en [`decisiones-pendientes.md`](decisiones-pendientes.md)).
En los retos de voz, el jugador **dice en voz alta la opción correcta** entre tres. Esta prueba mide
algo concreto: **¿el navegador entiende una palabra en inglés dicha por un hispanohablante?** Si
no la entiende, el jugador se frustra aunque sepa la respuesta, y hay que cambiar el diseño antes de
construir los niveles.

Se parece a la [prueba de voz de letras](prueba-de-voz.md), pero aquí se dice **una palabra entera**,
que es lo que mejor reconoce Chrome.

## Qué necesitas

- **Chrome** (o Edge). Firefox no tiene reconocimiento de voz.
- **Internet:** Chrome manda el audio a un servidor para reconocerlo.
- Un **micrófono** y un lugar sin mucho ruido.
- El juego abierto desde `localhost` (con `npm run dev`).
- **Nadie más hablando cerca.** En la prueba de letras, dos intentos se perdieron porque el micrófono
  captó una conversación.

## Cómo hacerla (unos 4 minutos por persona)

1. Abre **http://localhost:5173/?ingles**. Aparece la pantalla de prueba, no el juego.
2. Pulsa **ENTER**. La primera vez, Chrome pide permiso para el micrófono: acepta. Arriba debe decir
   `● ESCUCHANDO`.
3. Lee la ficha. Hay dos clases:
   - **Traducción:** ves una palabra en español y dices su traducción al inglés (_casa_ → «house»).
   - **Definición:** ves una definición en inglés y dices la palabra que corresponde.
4. **Di la opción correcta UNA sola vez**, en **inglés americano**, con voz clara. No leas todas las
   opciones: si dices dos, la respuesta no vale.
5. En cuanto lo que oyó el navegador encaja con una opción, la pantalla marca **✔** o **✘** y deja de
   escuchar. Así será en el juego.
6. Si no pasa nada, pulsa **ENTER** para parar y **espera a que diga «Parado»**.
7. Pulsa **ESPACIO** para pasar a la siguiente ficha (o **BACKSPACE** para repetir la misma). Cada intento
   queda anotado.
8. Al terminar las 10 fichas, pulsa **C**: copia todos los intentos como JSON al portapapeles. Pégalos
   en un archivo y pásalos.

| Tecla     | Qué hace                                                   |
| --------- | ---------------------------------------------------------- |
| ENTER     | Empezar o parar de escuchar                                |
| ESPACIO   | Pasar a la siguiente ficha                                 |
| BACKSPACE | Repetir la ficha (anota el intento)                        |
| C         | Copiar los intentos al portapapeles                        |
| 0         | Volver a la primera ficha (no borra los intentos anotados) |

## Qué probar

- **2 o 3 personas**, cada una con las **10 fichas** (5 de traducción y 5 de definición).
- Si alguien tiene acento muy marcado, anótalo: es justo el caso que queremos conocer.
- Si una persona **no sabe** una respuesta, que pulse ESPACIO sin decir nada. No debe adivinar: esta
  prueba mide el reconocimiento, no el vocabulario.
- Si se puede, que **una persona** pruebe también diciendo **a propósito una opción equivocada**
  en 2 fichas, para ver que el juego la marca ✘ y no la confunde con la correcta.

## Cómo se decide la opción

El navegador entrega hasta tres textos posibles. La regla (`src/utilidades/opciones.js`) es:

1. Se compara lo oído con cada opción. Se perdona **una letra de diferencia por cada 3 letras** de la
   opción (mínimo una): «dancer» vale como _danger_.
2. Si **una sola** opción encaja, es la elegida.
3. Si encajan **dos por igual** (por ejemplo, el jugador dijo dos opciones), no se elige ninguna.
4. Si no encaja ninguna, se sigue escuchando.

Por eso las tres opciones de cada ficha tienen que ser **completamente distintas**: una prueba
automática comprueba que no empiecen igual, que no se contengan y que estén a 3 o más letras de
distancia. Esa prueba también comprueba que **el enunciado no se parezca a ninguna opción** (si la
definición dijera _teaches_, se acertaría _teacher_ leyendo la pantalla).

## Qué anotar

El JSON de la tecla **C** ya trae, por cada intento: la ficha, las opciones, cuál era la correcta,
cuál se eligió, `acierto`, cuánta distancia hubo (`distanciaDeLoElegido`), el tiempo hasta responder
(`msHastaLaRespuesta`), lo que oyó el navegador (`oido`) y el flujo completo (`eventos`).

Además, anota por persona: el navegador, si tiene acento marcado y qué tan acostumbrada está a
hablar inglés.

## Cómo se decide con los resultados

Estos umbrales son una **propuesta**, no una regla:

| Fichas acertadas a la primera | Qué hacer                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------- |
| 80 % o más                    | La voz sirve para los niveles 1 y 2. Se sigue con el banco de fichas.             |
| Entre 60 % y 80 %             | Sirve con ayudas: más tolerancia, más intentos o más tiempo. Se miran los fallos. |
| Menos de 60 %                 | Hay que repensar el diseño (por ejemplo, elegir con el teclado y la voz de apoyo) |

Antes de contar un fallo como "del reconocedor", mira `oido` y `eventos`: si el navegador oyó la
palabra bien pero la regla no la eligió, el ajuste es nuestro (`LETRAS_POR_ERROR` en
`src/config.js`). Si el navegador oyó otra cosa, es del reconocedor o de la pronunciación.

## Qué NO se mide aquí

- La **voz del juego** (cuando el juego dice una palabra y el jugador la escribe, nivel 3). Es otra
  prueba y por ahora se confía en la voz del navegador.
- La **pronunciación** como nota: la prueba solo mira si el navegador entendió la palabra.
