# Decisiones pendientes

Cosas que el equipo (o el profesor) debe decidir. Están ordenadas por **cuánto afectan al código**:
las primeras conviene resolverlas antes de seguir muy lejos. Cuando se decida algo, se marca aquí
y se actualiza el documento que corresponda.

## 1. ¿Dos o tres niveles?

La tarea pide **Nivel 1 y Nivel 2**, pero el diseño habla de **3 fondos** (uno por nivel).
**Recomendación:** hacer 2 niveles completos y dejar el tercero como extra.

## 2. Autor de calidad total

Elegir entre Juran, Deming o Crosby y confirmar el nombre "Joseph Durand" con el profesor. Ver
[`calidad-total.md`](calidad-total.md). **Recomendación:** Deming (PDCA).

## 3. Voz: poderes, idioma y tiempo

- ¿Qué poderes hay además de la **granada**? (nombre, palabra, efecto, recarga).
- Idioma del reconocimiento: `es-PE` o `es-ES`.
- Tiempo para deletrear: ¿`base + letras × tiempoPorLetra`? Se define con el _spike_ de voz.
- ¿Se acepta un modo de **teclado** como respaldo?
- **Recomendación:** decidir después del _spike_ de voz (ver [`mapa-del-proyecto.md`](mapa-del-proyecto.md)).

## 4. Cofres

- ¿Dónde aparecen los **cofres especiales** (Revivir, PasaPalabra, DobleDash)? Por ejemplo, al
  vencer al jefe, en una sala secreta o con una probabilidad baja en cofres comunes.
- ¿El cofre con la llave da **también** una mejora o solo la llave?
- **PasaPalabra:** "1 uso cada 4 palabras", ¿se acumulan los usos? ¿qué pasa si se activa por error?
- **Revivir:** ¿se puede tener más de uno?

## 5. Combate

- **Disparo:** ¿manual (clics), automático o ambos con una opción?
- **Dash:** ¿qué tecla? ¿da inmunidad? ¿cuánto dura la recarga?
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
