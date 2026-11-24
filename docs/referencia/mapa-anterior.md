> **Documento reemplazado.** Este material es del diseño anterior (juego de eventos de reacción). El diseño actual está en [`../diseno-del-juego.md`](../diseno-del-juego.md). Se conserva solo como referencia.

# Mapa del proyecto

Relaciona cada parte del [documento de diseño](borrador-qte-companero.md) con el código que la va a
implementar. Es una guía de planificación: los módulos marcados como _pendiente_ todavía no
existen.

## Tecnología

| Pieza             | Elección                                        | Motivo                                                        |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| Motor             | Phaser 4 (última versión estable)               | Motor 2D con físicas Arcade, cámaras, audio y escenas         |
| Empaquetador      | Vite                                            | Servidor de desarrollo rápido y compilación para publicar     |
| Lenguaje          | JavaScript moderno, módulos ES (`type: module`) | Los módulos son estrictos por defecto; sin variables globales |
| Calidad de código | ESLint + Prettier                               | Estilo y errores comunes revisados automáticamente            |
| Mapas de nivel    | Tiled (JSON) — _por decidir_                    | Phaser lee mapas de Tiled de forma nativa                     |
| Voz               | Web Speech API (`SpeechRecognition`)            | Sin dependencias; no existe en Firefox, por eso hay fallback  |

## Estructura de carpetas

```
src/
  main.js          Crea el juego de Phaser
  config.js        Valores del juego y nombres de escenas
  escenas/         Una clase por pantalla o nivel
  entidades/       Jugador, enemigos, ratas, trampas
  sistemas/        Lógica reutilizable (QTE, voz, cámara lenta, audio)
  datos/           Definiciones de enemigos, palabras y niveles
  utilidades/      Funciones pequeñas sin dependencia de Phaser
public/assets/
  img/             Sprites, tilesets, fondos
  audio/           Efectos y música
docs/              Diseño, mapa y referencias
```

## Escenas (`src/escenas/`)

| Escena             | Diseño      | Estado       | Qué hace                                                |
| ------------------ | ----------- | ------------ | ------------------------------------------------------- |
| `EscenaArranque`   | —           | Hecha (base) | Muestra el título. Luego cargará recursos.              |
| `EscenaMenu`       | 8.1         | Pendiente    | Elegir modo teclado o voz; opciones                     |
| `EscenaNivel1`     | 9 (Nivel 1) | Pendiente    | Mazmorras inferiores: 5 zonas lineales                  |
| `EscenaNivel2`     | 9 (Nivel 2) | Pendiente    | Alcantarillas y muros exteriores: 5 zonas lineales      |
| `EscenaTransicion` | 9           | Pendiente    | Texto breve y cambio de paleta entre niveles            |
| `EscenaFinal`      | 3, 11       | Pendiente    | Salida al mar (paleta luminosa) y nota histórica        |
| `EscenaInterfaz`   | 6.2         | Pendiente    | Capa de UI encima del nivel: vida, "!", palabra y barra |

## Sistemas (`src/sistemas/`)

| Sistema          | Diseño  | Responsabilidad                                                               |
| ---------------- | ------- | ----------------------------------------------------------------------------- |
| `EventoReaccion` | 6       | Máquina de estados del QTE: audio → "!" → palabra y barra → acierto o fallo   |
| `TiempoLento`    | 6.2     | Rampa de entrada y salida de la cámara lenta (0.2x). La barra usa tiempo real |
| `EntradaTeclado` | 6, 8.1  | Compara lo tecleado con la palabra del evento                                 |
| `EntradaVoz`     | 8       | Micrófono, similitud aproximada, un reintento, fallback a teclado             |
| `ZonaPeligro`    | 7       | Detecta al jugador en un círculo o un cono y dispara el evento                |
| `Audio`          | 6.2, 11 | Telegraph sonoro de cada tipo de peligro y ambiente                           |
| `Opciones`       | 8.3     | Modo de entrada, tiempos configurables, guardado en `localStorage`            |

## Entidades (`src/entidades/`)

| Entidad     | Diseño | Notas                                                                      |
| ----------- | ------ | -------------------------------------------------------------------------- |
| `Jugador`   | 10     | Movimiento top-down de 4 u 8 direcciones, vida simple, retroceso al fallar |
| `PresoLoco` | 7.1    | Zona circular. Variante `PresoArmado` con otros parámetros (7.2)           |
| `Soldado`   | 7.3    | Zona en cono de visión. Posición fija                                      |
| `Rata`      | 7.4    | Solo ambiente: no dispara eventos                                          |
| `Trampa`    | 6.3    | Se dispara al pisar un _trigger_                                           |
| `Derrumbe`  | 6.3    | Cambia el mapa si el jugador falla                                         |

## Datos (`src/datos/`)

Las palabras, tiempos y parámetros de cada enemigo van en archivos de datos, no dentro de las
clases. Así el equipo puede ajustar el balance sin tocar la lógica.

- `eventos.js`: tipo de evento → color del "!", sonido, palabras posibles, consecuencia.
- `enemigos.js`: radio o cono, tiempo del QTE, daño de cada enemigo.
- `niveles.js`: lista de zonas y mapa de cada nivel.

## Hoja de ruta sugerida

1. **Base técnica** — proyecto Vite + Phaser, lint, formato. _(hecho)_
2. **Jugador y mapa** — mover un personaje por un mapa top-down de prueba con colisiones.
3. **Evento de reacción con teclado** — el QTE completo con un solo enemigo de prueba.
4. **Cámara lenta y reglas de justicia** — rampa de tiempo y casos en que el "!" no puede salir.
5. **Nivel 1 completo** — las 5 zonas, preso loco, trampa, ratas, agua.
6. **Modo voz** — reconocimiento, tolerancia a errores y fallback.
7. **Nivel 2 completo** — derrumbes, soldado con cono, cañonazo, cambio de mapa.
8. **Final y pulido** — pantalla luminosa, nota histórica, audio, opciones.

## Preguntas abiertas del borrador

- [ ] Título definitivo del juego (el actual es provisional).
- [ ] Tamaño del píxel y resolución interna (hoy `480×270` provisional en `src/config.js`).
- [ ] Duración de cada nivel (el borrador dice "X min"; el total es 20–25 min).
- [ ] Cómo se mueve el personaje: 4 u 8 direcciones.
- [ ] Idioma del reconocimiento de voz (`es-PE` o `es-ES`) y navegadores que se prometen.
- [ ] Origen de los recursos: sprites, tilesets y audio (propios, libres o comprados).
- [ ] Cómo se guarda el progreso, si se guarda.
