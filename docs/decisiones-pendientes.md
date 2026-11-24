# Decisiones pendientes

Cosas que el equipo (o el profesor) debe decidir. Están ordenadas por **cuánto afectan al código**:
las primeras conviene resolverlas antes de seguir muy lejos. Cuando se decida algo, se marca aquí
y se actualiza el documento que corresponda.

## 1. Multijugador (crítica)

La tarea dice **tipo MULTIJUGADOR**, pero el diseño actual no lo describe. Cambia mucho la
arquitectura, así que hay que decidirlo pronto.

| Opción                           | Cómo sería                                           | Ventajas                           | Problemas                                                          |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| A. Cooperativo local             | 2 personas en el mismo computador                    | Es lo más fácil de programar       | Un solo micrófono y un solo ratón; difícil controlar a dos con voz |
| B. Cooperativo en línea (WebRTC) | Cada persona en su navegador; uno hace de anfitrión  | Cada una tiene su propio micrófono | Más complejo; hay que sincronizar estado                           |
| C. En línea con servidor         | Un servidor (Node con WebSocket) reparte el estado   | Es lo más robusto                  | Requiere servidor y publicación; más trabajo                       |
| D. Competitivo por turnos        | Dos jugadores pasan el control o compiten en puntaje | Poco trabajo de red                | Se aleja de la idea del juego                                      |

**Recomendación:** preguntar al profesor qué significa "multijugador" en la tarea. Mientras tanto,
programar con la preparación de [`mapa-del-proyecto.md`](mapa-del-proyecto.md), sección 7
(acciones de entrada, lista de jugadores, estado simple), y decidir entre A y B antes del paso 5.

## 2. ¿Dos o tres niveles?

La tarea pide **Nivel 1 y Nivel 2**, pero el diseño habla de **3 fondos** (uno por nivel).
**Recomendación:** hacer 2 niveles completos y dejar el tercero como extra.

## 3. Autor de calidad total

Elegir entre Juran, Deming o Crosby y confirmar el nombre "Joseph Durand" con el profesor. Ver
[`calidad-total.md`](calidad-total.md). **Recomendación:** Deming (PDCA).

## 4. Voz: poderes, idioma y tiempo

- ¿Qué poderes hay además de la **granada**? (nombre, palabra, efecto, recarga).
- Idioma del reconocimiento: `es-PE` o `es-ES`.
- Tiempo para deletrear: ¿`base + letras × tiempoPorLetra`? Se define con el _spike_ de voz.
- ¿Se acepta un modo de **teclado** como respaldo?
- **Recomendación:** decidir después del _spike_ de voz (ver [`mapa-del-proyecto.md`](mapa-del-proyecto.md)).

## 5. Cofres

- ¿Dónde aparecen los **cofres especiales** (Revivir, PasaPalabra, DobleDash)? Por ejemplo, al
  vencer al jefe, en una sala secreta o con una probabilidad baja en cofres comunes.
- ¿El cofre con la llave da **también** una mejora o solo la llave?
- **PasaPalabra:** "1 uso cada 4 palabras", ¿se acumulan los usos? ¿qué pasa si se activa por error?
- **Revivir:** ¿se puede tener más de uno?

## 6. Combate

- **Disparo:** ¿manual (clics), automático o ambos con una opción?
- **Dash:** ¿qué tecla? ¿da inmunidad? ¿cuánto dura la recarga?
- **Enemigo débil:** ¿camina hacia el jugador, dispara o se mueve en patrones?
- **Jefe:** vida, ataques básicos y cuántos ataques fuertes hace por pelea.
- **Muerte:** ¿vuelve a la portada, reinicia el nivel o la sala?

## 7. Ambientación y personajes

- ¿Se mantiene la **Fortaleza del Real Felipe** (sitio del Callao) como escenario? Es lo que
  decía el borrador y encaja con el primer piso estilo prisión.
- ¿Quién es el **jefe** de cada piso? (el borrador decía que Rodil no sería jefe final).
- **Segundo piso:** ¿qué lugar y qué estilo? (alcantarillas, muros exteriores, patio…).
- Nota histórica final: ¿quién la escribe y con qué fuentes?

## 8. Arte

- Confirmar el tamaño del jugador (**32×48 px**) y de la casilla (**32 px**).
- Pedir el sprite del jugador **a tamaño real** (el actual está ampliado y borroso).
- ¿De dónde sale el audio? (propio, libre o comprado; anotar licencias).

## 9. Entrega

- ¿Se publica el juego en línea (por ejemplo en GitHub Pages) o se presenta desde un computador?
- ¿Hace falta un informe de calidad total aparte del juego?
