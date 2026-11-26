# Mapa del proyecto

Qué módulos de código implementan cada parte del [diseño](diseno-del-juego.md) y en qué orden
conviene construirlos. Los módulos marcados como _pendiente_ todavía no existen.

## 1. Tecnología

| Pieza             | Elección                                        | Motivo                                                          |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Motor             | Phaser 4 (última versión estable)               | Escenas, físicas Arcade, cámaras, audio, partículas             |
| Empaquetador      | Vite                                            | Servidor rápido y compilación lista para publicar               |
| Lenguaje          | JavaScript moderno, módulos ES (`type: module`) | Los módulos son estrictos por defecto                           |
| Calidad de código | ESLint + Prettier                               | Estilo y errores comunes revisados automáticamente              |
| Pruebas           | Vitest (_pendiente de agregar_)                 | Probar la lógica pura (deletreo, llave del nivel) sin navegador |
| Voz               | Web Speech API (`SpeechRecognition`)            | Sin dependencias; no existe en Firefox                          |
| Publicación       | GitHub Pages (_opcional_)                       | `vite.config.js` ya usa rutas relativas                         |

## 2. Estructura de carpetas

```
src/
  main.js            Crea el juego de Phaser
  config.js          Valores del juego y nombres de escenas
  escenas/           Una clase por pantalla
  entidades/         Jugador, enemigo (débil y ratas), jefe, bala, cofre, puerta
  sistemas/          Lógica reutilizable (mapa, voz, cámara lenta, recompensas, efectos)
  datos/             Palabras, recompensas, niveles y recursos (sin lógica)
  utilidades/        Funciones puras sin Phaser (deletreo, azar)
public/assets/
  img/  audio/       Recursos finales (los dibujan los compañeros)
docs/                Diseño, mecánicas, calidad y decisiones
```

## 3. Escenas (`src/escenas/`)

| Escena             | Qué hace                                                           | Estado       |
| ------------------ | ------------------------------------------------------------------ | ------------ |
| `EscenaArranque`   | Carga recursos y genera las texturas provisionales                 | Hecha (base) |
| `EscenaPortada`    | Título, botón de jugar, modo de entrada (voz o teclado)            | Pendiente    |
| `EscenaJuego`      | Un nivel: sala actual, jugador, enemigos, cofres, jefe             | Pendiente    |
| `EscenaHUD`        | Capa de interfaz encima del nivel: vida, dash, palabra y barra     | Pendiente    |
| `EscenaTransicion` | Texto breve entre niveles                                          | Pendiente    |
| `EscenaFinal`      | Pantalla final y nota histórica; también "game over"               | Pendiente    |
| `EscenaPruebaVoz`  | Pantalla de laboratorio para probar el micrófono (solo desarrollo) | Pendiente    |

## 4. Sistemas (`src/sistemas/`)

| Sistema            | Diseño         | Responsabilidad                                                          |
| ------------------ | -------------- | ------------------------------------------------------------------------ |
| `Entrada`          | Controles      | Abstrae teclado y ratón en "acciones" (mover, apuntar, disparar, dash)   |
| `MapaDelNivel`     | §4             | Cuadrícula 3×3, posición de cada sala, puertas, cámara que salta de sala |
| `GeneradorDeNivel` | §4.2           | Sortea en qué sala está la llave y arma el contenido de cada sala        |
| `Disparo`          | Mecánicas 2    | Cadencia, dirección hacia el cursor, balas                               |
| `Dash`             | Mecánicas 3    | Impulso, recarga, cargas (para DobleDash)                                |
| `Recompensas`      | §6             | Aplica mejoras comunes y cofres especiales                               |
| `ReconocedorDeVoz` | Mecánicas 5    | Envuelve la Web Speech API: permisos, inicio y fin, resultados, errores  |
| `EventoDeletreo`   | Mecánicas 5, 6 | Muestra palabra y barra, avanza letra a letra, da acierto o fallo        |
| `TiempoLento`      | Mecánicas 6.1  | Rampa de la cámara lenta; la barra usa tiempo real                       |
| `Efectos`          | Mecánicas 8    | Temblor, destello, partículas, viñeteado                                 |
| `Audio`            | Mecánicas 8    | Efectos de sonido y música por piso                                      |

## 5. Entidades (`src/entidades/`)

`Jugador`, `Enemigo`, `Jefe`, `Bala`, `Cofre`, `Puerta`, `Granada` (poder especial).
Todas son _pendientes_. Un archivo por clase y el nombre del archivo es el de la clase.

## 6. Datos (`src/datos/`)

Los números y textos del juego van en archivos de datos, no dentro de las clases. Así se ajusta el
balance sin tocar la lógica.

- `palabras.js`: banco de palabras por dificultad.
- `recompensas.js`: valores de cada mejora y cofre especial.
- `niveles.js`: fondo, música y parámetros de cada piso.
- `recursos.js`: catálogo de claves de imágenes y audio (ver [`guia-de-recursos.md`](guia-de-recursos.md)).

## 7. Multijugador (aplazado)

Por ahora el juego es de **un solo jugador**. El equipo decidió dejar el multijugador para el final
y hacerlo **solo si el profesor lo exige**. No se programa nada de red ni de varios jugadores
todavía. Detalles y opciones: [`decisiones-pendientes.md`](decisiones-pendientes.md), punto 9.

## 8. Hoja de ruta: de poco en poco

Cada paso termina en algo que se **puede ver funcionando** y se entrega con un pull request
pequeño. Los pasos del 1 al 5 se hacen en orden; el **spike de voz** va en paralelo desde el
principio porque es lo más riesgoso.

| Paso | Qué se construye                                                                           | Cómo se sabe que está listo                                                                           |
| ---- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 0    | Preparar la base: pantalla de 800×640, texturas provisionales por código                   | `npm run dev` muestra una sala vacía con paredes                                                      |
| 1    | Jugador que se mueve (flechas o WASD) con colisiones                                       | Se mueve por la sala y no atraviesa las paredes                                                       |
| 2    | Apuntar con el ratón y disparar (mantener clic)                                            | Salen balas hacia el cursor con cadencia fija                                                         |
| 3    | Un enemigo débil con vida; sala que se limpia                                              | El enemigo recibe daño, muere y la sala se marca como limpia                                          |
| 4    | Cofre con mejora común (vida, ataque, velocidad) y HUD                                     | Al limpiar la sala aparece el cofre y la mejora se nota en la pantalla                                |
| 5    | Mapa 3×3: 8 salas, puertas, cámara que salta, sala central con llave                       | Se recorre el anillo; la llave siempre aparece en algún cofre                                         |
| 6    | Dash, y luego DobleDash                                                                    | El dash tiene recarga visible; con DobleDash se puede usar dos veces                                  |
| 7    | Deletreo con teclado (respaldo), barra de tiempo real y 3 modos (visible, huecos, memoria) | Se teclea una palabra; hay acierto, fallo y tiempo agotado; en huecos y memoria la palabra se esconde |
| 8    | Voz real: integrar el reconocimiento con el deletreo                                       | Deletrear con el micrófono funciona en Chrome con tolerancia de errores                               |
| 9    | Poder especial por voz (granada)                                                           | Deletrear una palabra lanza la granada                                                                |
| 10   | Jefe: ataques básicos y ataque fuerte con cámara lenta                                     | El ataque fuerte solo se evita deletreando; al revés devuelve el golpe                                |
| 11   | Cofres especiales: Revivir, PasaPalabra, DobleDash                                         | Cada uno hace lo que dice el diseño                                                                   |
| 12   | Portada, transiciones, Nivel 2 y pantalla final                                            | Se juega de la portada al final con los dos niveles                                                   |
| 13   | Efectos y sonido                                                                           | Temblor, destellos, partículas, música y sonidos en todo el juego                                     |
| 14   | Multijugador (solo si el profesor lo exige)                                                | Dos personas pueden jugar la misma partida                                                            |
| 15   | Pulido, pruebas finales, registro de calidad y entrega                                     | Lista de requisitos completa                                                                          |

### Spike de voz (en paralelo, desde ya)

> **Hecho el código (paso 8):** la pantalla de prueba existe (`?voz`) y el procedimiento está en
> [`prueba-de-voz.md`](prueba-de-voz.md). **Falta hacer la prueba con personas** y ajustar con los
> resultados.

Un **spike** es una prueba corta para resolver una duda técnica antes de construir encima. Hay que
averiguar **cuanto antes** qué tan bien reconoce el navegador a alguien deletreando en español:

1. Una página de prueba (`EscenaPruebaVoz`) que muestre en pantalla lo que reconoce.
2. Probar con 5 personas y 5 palabras (cortas y largas, con _ñ_ y _rr_).
3. Medir cuántas letras acierta y cuánto tarda.
4. Con los resultados, ajustar la normalización (`utilidades/deletreo.js`) y el tiempo por letra.

Si el resultado es malo, hay que cambiar el diseño (por ejemplo, decir **palabras cortas** en vez
de deletrear) **antes** de construir el jefe. Por eso va en paralelo.

### Cómo repartir el trabajo (equipo de hasta 3)

- **Lógica del juego:** pasos 0 al 6, 10, 11 y 12.
- **Voz:** spike, pasos 7, 8 y 9.
- **Recursos (los dibujan los compañeros):** sprites, fondos, sonidos, siguiendo
  [`guia-de-recursos.md`](guia-de-recursos.md).

Cada tarea va en su propia rama y su propio pull request, como explica el README.
