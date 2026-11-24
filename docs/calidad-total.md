# Calidad total en el desarrollo

La tarea pide elegir **un autor** (Joseph Durand —probablemente Joseph M. Juran—, William Edward
Deming o Philip Crosby) y **aplicar sus principios de calidad total** durante el desarrollo del
videojuego. Este documento propone cuál elegir y cómo dejar evidencia de que se aplicó.

> Los resúmenes de cada autor son un punto de partida. Hay que contrastarlos con el material del
> curso antes de entregar.

## 1. Los tres autores, en pocas palabras

| Autor  | Idea central                                                            | Herramienta típica                                                |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Deming | La calidad se construye en el **proceso** y se mejora de forma continua | Ciclo **PDCA** (Planificar, Hacer, Verificar, Actuar), 14 puntos  |
| Juran  | Calidad es **aptitud para el uso**; se gestiona con tres procesos       | **Trilogía de Juran**: planificar, controlar y mejorar la calidad |
| Crosby | La calidad es **cumplir los requisitos** y hacerlo bien a la primera    | **Cero defectos** y costo de la no calidad                        |

## 2. Propuesta: Deming y el ciclo PDCA

Es la que mejor encaja con trabajar "de poco en poco", porque **cada paso de la hoja de ruta
(ver [`mapa-del-proyecto.md`](mapa-del-proyecto.md)) es un ciclo PDCA completo**:

| Fase PDCA      | Qué hacemos en el proyecto                                                           | Evidencia                                 |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| **Planificar** | Definir el objetivo del paso y cómo sabremos que está bien ("listo cuando…")         | Descripción de la tarea y del PR          |
| **Hacer**      | Implementarlo en una rama pequeña                                                    | Commits en español, rama propia           |
| **Verificar**  | `npm run lint`, `npm run build`, pruebas, revisión de un compañero y prueba de juego | PR aprobado, resultados de las pruebas    |
| **Actuar**     | Corregir lo que falló y **estandarizar** lo aprendido (README, `CLAUDE.md`, datos)   | Cambios posteriores y registro de calidad |

### Principios de Deming y su práctica concreta

| Principio de Deming                    | Práctica en el proyecto                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Mejora constante del sistema           | Cada paso termina con una revisión: ¿qué mejoramos del proceso?                               |
| No depender de la inspección masiva    | La calidad entra mientras se construye (lint, formato, pruebas automáticas), no solo al final |
| Reducir la variación                   | Valores del juego en `config.js` y `datos/`; un mismo estilo de código para todos             |
| Romper barreras entre áreas            | Lógica, voz y arte comparten catálogo de recursos y revisan los PR entre sí                   |
| Orgullo por el trabajo bien hecho      | Revisión de PR: nadie mezcla su propio trabajo sin que otro lo mire                           |
| El cliente es lo que define la calidad | **Pruebas de juego** con compañeros: ¿se entiende?, ¿se divierte?, ¿la voz funciona?          |

## 3. Si el equipo prefiere otro autor

| Si eligen… | Cómo se traduce al proyecto                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Juran      | **Planificar** = diseño y criterios de aceptación; **Controlar** = lint, build, pruebas y revisión de PR; **Mejorar** = corregir con datos de las pruebas de juego |
| Crosby     | **Cero defectos**: la regla es que nada se mezcla en `main` si no pasa lint, build y revisión; se mide el costo de arreglar errores tarde                          |

## 4. Registro de calidad (plantilla)

Un registro corto por cada paso de la hoja de ruta. Puede vivir en la descripción del PR o en un
archivo `docs/calidad/registro.md`.

```
Paso: 5 — Mapa 3×3 con llave
Planificar: la llave debe aparecer siempre en alguno de los 8 cofres.
Hacer:      rama feat/mapa-3x3, PR #12.
Verificar:  prueba automática (1000 niveles: la llave siempre sale), revisión de un compañero, prueba de juego.
Actuar:     se encontró que una puerta quedaba abierta; se corrigió y se agregó a las reglas del nivel.
Lección:    probar el sorteo con muchas repeticiones, no solo a mano.
```

## 5. Qué medir

- Cuántos pasos de la hoja de ruta se entregan con su PR aprobado.
- Cuántos errores aparecen **después** de mezclar en `main` (idealmente, cero).
- Resultados de las pruebas de voz: porcentaje de letras bien reconocidas.
- Opinión de los jugadores de prueba (claridad, dificultad, diversión).
