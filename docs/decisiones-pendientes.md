# Decisiones pendientes

Cosas que el equipo (o el profesor) debe decidir. Están ordenadas por **cuánto afectan al código**:
las primeras conviene resolverlas antes de seguir muy lejos. Cuando se decida algo, se marca aquí
y se actualiza el documento que corresponda.

## Cambio de enfoque (26/11/2026): aprender inglés jugando

Deletrear en español con la voz no se pudo hacer fiable: Chrome junta las letras en palabras, pierde
partes y oye las conversaciones (ver las tres rondas en [`prueba-de-voz.md`](prueba-de-voz.md)). Una
palabra entera es justo lo que Chrome reconoce mejor, así que **el reto cambia de deletrear a
vocabulario en inglés**, para hispanohablantes que quieren aprender. **El profesor lo aprobó**
(se le consultó el 25/11/2026). La ambientación histórica (Callao, 1824–1826) se mantiene solo como
ambientación: las palabras no tienen que ser del tema.

Tres dificultades (el reto es el mismo evento hacia el resto del juego: acierto o fallo):

| Nivel | Qué se ve                                              | Cómo se responde                                      |
| ----- | ------------------------------------------------------ | ----------------------------------------------------- |
| 1     | Una palabra en español y tres opciones en inglés       | **Con la voz**: se dice la opción correcta            |
| 2     | Una definición en inglés y tres palabras               | **Con la voz**: se dice la palabra                    |
| 3     | Nada: el juego **dice** la palabra (voz del navegador) | **Con el teclado**: se escribe; **ESPACIO** la repite |

- **Jefe 1** alterna los niveles 1 y 2; el **jefe 2** alterna el 2 y el 3 (el 1 ya es demasiado fácil).
- Las **tres opciones** de cada ficha deben ser **completamente distintas** (que no empiecen igual, que
  no se contengan y que no se parezcan al enunciado); una prueba automática lo comprueba
  (`pruebas/opciones.test.js`).
- **Inglés americano** (`en-US`). Se confía en que quien juega practique esa pronunciación.
- **Voz del juego** (nivel 3): se usa la del navegador. Si en algún equipo suena mal, se grabarán los
  audios, pero **no se hace trabajo extra hasta que haga falta**.
- Tecla para repetir la palabra en el nivel 3: **ESPACIO** (la `R` no sirve: es una letra que se escribe).
  Durante el reto el dash se desactiva.
- **Contenido:** las definiciones se escriben con palabras propias (no se copian de diccionarios).
  Posible fuente de palabras: los mazos de Anki del equipo («Inglés | 1000 palabras más comunes» y otro
  de 4000); se tomaría **la lista de palabras**, no sus definiciones ni sus audios.
- **Anki:** la repetición espaciada (que la palabra fallada vuelva antes) queda como extra, después.

Orden de trabajo: **1.** prueba corta de voz en inglés ([`prueba-de-voz-ingles.md`](prueba-de-voz-ingles.md)),
que decide si se sigue _(hecho el 26/11/2026 con una persona: 10 de 10; faltan 1 o 2 personas más)_ · **2.** banco
de fichas y comparación ([`vocabulario.md`](vocabulario.md); función pura con pruebas) _(hecho: 60 palabras
de los libros 1 y 2; falta que el equipo revise las traducciones y las definiciones)_ · **3.** nivel 3
(voz del juego y teclado) _(hecho el 26/11/2026: tecla `I`, ver [`mecanicas.md`](mecanicas.md) 5.8; falta probarlo con el altavoz y con gente)_ · **4.** niveles 1 y 2 con el micrófono _(hecho el 26/11/2026: teclas `O` y `P`, ver [`mecanicas.md`](mecanicas.md) 5.10; falta probarlo hablando de verdad)_ · **5.** conectarlo al jefe.

## 1. ¿Dos o tres niveles?

La tarea pide **Nivel 1 y Nivel 2**, pero el diseño habla de **3 fondos** (uno por nivel).
**Recomendación:** hacer 2 niveles completos y dejar el tercero como extra.

## 2. Autor de calidad total

Elegir entre Juran, Deming o Crosby y confirmar el nombre "Joseph Durand" con el profesor. Ver
[`calidad-total.md`](calidad-total.md). **Recomendación:** Deming (PDCA).

## 3. Voz: poderes, idioma y tiempo

- **Granada** (hecha el 26/11/2026, tecla `G`, ver [`mecanicas.md`](mecanicas.md) 5.11): reto de nivel 1,
  daño 3 en un radio de 96 px, recarga 6 s si se acierta y 2,5 s si se falla _(todo provisional)_.
  **Confirmar o ajustar:** ¿el daño y el radio, la recarga, y si el reto debe ser de otro nivel?
- ¿Qué poderes hay además de la **granada**? (nombre, efecto, recarga y de qué nivel de inglés es su reto).
- Idioma del reconocimiento: `es-PE` o `es-ES`. Hoy `es-PE` _(provisional; aceptado por ahora el 25/11/2026)_; se decide con la
  [prueba de voz](prueba-de-voz.md).
- **Prueba de voz con personas:** falta hacerla (5 personas, 5 palabras). Sus resultados deciden el
  idioma, la tabla de nombres de letras, el tiempo por letra y si la voz es viable.
- Tiempo con voz: hoy **el doble (×2)** que con el teclado. **Decidido el 25/11/2026** con la segunda ronda de la prueba de voz.
  Hablando seguido se midió ~0,44 s por letra; con pausas, **0,7 a 0,85 s por letra**: con ×1,5
  (0,6 s por letra) las palabras largas se quedaban cortas; con ×2 alcanzan.
- ~~La **B y la V** no se pueden distinguir hablando.~~ **Decidido (25/11/2026):** «be» vale para la B
  **y** para la V; no se le pide al jugador «be larga» ni «uve». (Decir «be larga»/«ve corta» sigue
  funcionando como forma exacta.)
- **«de» por «te»:** apareció una vez en la primera ronda y **no se repitió en los 35 intentos de la
  segunda**. Se deja como está (la D no vale por la T). Si con más personas se repite, se cambia.
- **Letras juntas en una palabra:** si se deletrea seguido, Chrome las junta («calllao») y se pierden.
  Hoy se pide hablar con una pausa entre letras. Las ayudas (teclas P y L de `?voz`) **no sirvieron**
  en la segunda ronda: se sigue con el servidor. Sigue fallando sobre todo con «ce a» («cañña», «Canon»).
  Opciones: evitar palabras que empiecen así, o dar más errores perdonados.
- Con voz, el **teclado se desactiva** mientras se deletrea, para que no se pueda hacer trampa.
  ¿Se confirma, o debe quedar como ayuda?
- Tiempo para deletrear: hoy es `1,5 s + 0,4 s × letras` con teclado, y ×1,5 al revés _(provisional)_.
  El de voz se define con el _spike_ de voz.
- Modo de **teclado** como respaldo: hecho. ¿Cuántos errores se perdonan? Hoy son 2 _(provisional)_.
- Mientras se deletrea, el jugador no se mueve pero los enemigos siguen. **Confirmado.** La cámara
  lenta es para los ataques fuertes del jefe **y, desde el 26/11/2026, para el reto de los poderes**
  (la granada); dura lo que la cuenta regresiva. En el ataque fuerte, si el jugador falla o se le
  acaba el tiempo, el golpe le cae sí o sí.
- **Modos de deletreo** (`visible`, `huecos`, `memoria`; ver `mecanicas.md` 5.8): ¿dónde se usa cada
  uno? Por ejemplo, por nivel (más difícil en el nivel 2), por tipo de palabra o por quién ataca.
  Falta decidir cuál va con el ataque fuerte del jefe y cuál con los poderes.
- Tiempo de lectura en `huecos` y `memoria`: hoy `0,8 s + 0,12 s por letra` _(provisional)_.
- En `huecos` las letras acertadas se descubren (como el Ahorcado) y en `memoria` no se ve el avance;
  el marco rojo de error se muestra en todos los modos _(provisional)_. ¿Se confirma?
- Modo con **voz que dice la palabra** (no se muestra nunca): después del paso 8. Habrá que decidir si
  se usa la voz del navegador (`speechSynthesis`) o grabaciones.
- **Recomendación:** decidir después del _spike_ de voz (ver [`mapa-del-proyecto.md`](mapa-del-proyecto.md)).

## 4. Cofres

- ¿Dónde aparecen los **cofres especiales** (Revivir, PasaPalabra, DobleDash)? Por ejemplo, al
  vencer al jefe, en una sala secreta o con una probabilidad baja en cofres comunes.
- ¿El cofre con la llave da **también** una mejora o solo la llave? _(Provisional: da las dos cosas.)_
- **PasaPalabra:** "1 uso cada 4 palabras", ¿se acumulan los usos? ¿qué pasa si se activa por error?
- **Revivir:** ¿se puede tener más de uno?

## 5. Combate

- **Disparo:** ¿manual (clics), automático o ambos con una opción?
- **Dash:** hoy es la barra espaciadora, con 0,2 s de inmunidad y 1,2 s de recarga _(provisional)_.
  ¿Se confirma? ¿El DobleDash recarga las dos cargas a la vez (como está) o una por una?
- **Enemigo débil:** ¿camina hacia el jugador, dispara o se mueve en patrones?
- **Jefe:** vida, ataques básicos y cuántos ataques fuertes hace por pelea.
- **Muerte:** ¿vuelve a la portada, reinicia el nivel o la sala?

## 6. Ambientación y personajes

- ¿Se mantiene la **Fortaleza del Real Felipe** (sitio del Callao) como escenario? Es lo que
  decía el borrador y encaja con el primer piso estilo prisión.
- ¿Quién es el **jefe** de cada piso? (el borrador decía que Rodil no sería jefe final).
- **Segundo piso:** ¿qué lugar y qué estilo? (alcantarillas, muros exteriores, patio…).
- Nota histórica final: ¿quién la escribe y con qué fuentes?

## 7. Arte

- Confirmar el tamaño del jugador (**32×48 px**) y de la casilla (**32 px**).
- Pedir el sprite del jugador **a tamaño real** (el actual está ampliado y borroso).
- ¿De dónde sale el audio? (propio, libre o comprado; anotar licencias).

## 8. Entrega

- ¿Se publica el juego en línea (por ejemplo en GitHub Pages) o se presenta desde un computador?
- ¿Hace falta un informe de calidad total aparte del juego?

## 9. Multijugador (aplazado)

La tarea dice **tipo MULTIJUGADOR**, pero el equipo decidió **no hacerlo por ahora**: se confía en
que el profesor acepte una excepción. **Si el profesor lo exige, se hace al final**, cuando el
resto del juego ya esté terminado. Mientras tanto no se programa nada de red ni de varios jugadores.

Opciones para ese momento:

| Opción                           | Cómo sería                                           | Problemas                                                          |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| A. Cooperativo local             | 2 personas en el mismo computador                    | Un solo micrófono y un solo ratón; difícil controlar a dos con voz |
| B. Cooperativo en línea (WebRTC) | Cada persona en su navegador; uno hace de anfitrión  | Más complejo; hay que sincronizar estado                           |
| C. En línea con servidor         | Un servidor (Node con WebSocket) reparte el estado   | Requiere servidor y publicación                                    |
| D. Competitivo por turnos        | Dos jugadores pasan el control o compiten en puntaje | Se aleja de la idea del juego                                      |

**Riesgo a tener presente:** agregar multijugador al final es mucho trabajo, sobre todo con la voz
(cada persona necesita su propio micrófono). Si hay una forma de confirmar con el profesor qué
espera, conviene hacerlo pronto, aunque no se programe nada todavía.
