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
3. **Deletrea la palabra** que aparece, diciendo el nombre de cada letra: _efe, e, ere, ere, o…_
   Habla a tu ritmo natural, no más lento de lo normal.
4. Mira en pantalla:
   - **Lo que oyó el navegador:** el texto tal cual, con su porcentaje de confianza.
   - **Letras que entendí:** las letras que el juego saca de ese texto. Las que van entre paréntesis
     son errores.
   - **No son letras:** lo que el navegador escribió que no es el nombre de una letra (por ejemplo,
     la palabra entera).
5. Cuando termines (o te canses), pulsa **BACKSPACE** para repetir la palabra o **ESPACIO** para pasar
   a otra. Cada intento queda **anotado**.
6. Prueba también **al revés** (tecla **R**).
7. Al final pulsa **C**: copia todos los intentos como JSON al portapapeles. Pégalos en un archivo o
   en el chat. (Si no se puede copiar, el JSON queda en la consola del navegador.)

| Tecla     | Qué hace                              |
| --------- | ------------------------------------- |
| ENTER     | Empezar o parar de escuchar           |
| ESPACIO   | Pasar a otra palabra                  |
| BACKSPACE | Repetir la palabra (anota el intento) |
| R         | Cambiar entre al derecho y al revés   |
| C         | Copiar los intentos al portapapeles   |

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
4. **`RETENER_ULTIMA`**: si hay letras que se cuentan mal, probar con `false` y comparar.

## Cosas que ya sabemos

- **B y V suenan igual.** Ningún reconocedor las distingue, así que "be" y "ve" valen para las dos.
  Solo se distinguen si se dice _be larga_ o _ve corta_ / _uve_.
- Si el navegador junta las letras en una **palabra** (_efe e ere_ → «fer»), esa palabra **no
  cuenta**: se ignora y queda en _No son letras_. Si pasa mucho, es una señal de que hay que
  hablar con pausas o cambiar el diseño.
- Chrome **corta** el reconocimiento tras un silencio. El juego lo **reinicia solo** mientras se
  deletrea.
- Si el micrófono no funciona (sin permiso, sin internet, sin soporte), el deletreo **pasa solo al
  teclado** y lo avisa en pantalla: el juego nunca se queda sin forma de deletrear.

## Probar la voz dentro del juego

En el juego, la tecla **V** cambia entre deletrear con el **teclado** y con la **voz** _(provisional,
hasta el paso 9)_. Después, **E**, **T** e **Y** piden la palabra como siempre (ver
[`mecanicas.md`](mecanicas.md) 5.7 y 5.8). Con la voz, el tiempo es 50 % mayor y el teclado se
desactiva mientras el micrófono esté activo.
