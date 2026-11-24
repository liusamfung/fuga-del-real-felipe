# Guía de recursos (sprites, fondos y audio)

Para los compañeros que dibujan y para quienes programan con recursos provisionales.

## 1. Medidas del juego

| Elemento           | Medida       | Nota                                                 |
| ------------------ | ------------ | ---------------------------------------------------- |
| Pantalla del juego | 800×640 px   | Una sala completa por pantalla                       |
| Sala               | 800×640 px   | 25×20 casillas de 32 px                              |
| Mapa de un nivel   | 2400×1920 px | 3×3 salas; es el tamaño de cada fondo                |
| Casilla (tile)     | 32×32 px     | Propuesta                                            |
| Jugador            | 32×48 px     | El sprite actual mide 256×384 px, que es 8 veces eso |

> El sprite del jugador que tenemos parece un dibujo de 32×48 **ampliado 8 veces** y por eso se ve
> borroso. Hay que pedir la versión **a tamaño real** (32×48) para no perder nitidez.

## 2. Formato

- Imágenes en **PNG con fondo transparente**, sin suavizado (_pixel art_ nítido).
- Fondos: un PNG de **2400×1920 px** por piso.
- Hojas de animación (_spritesheets_): una fila por dirección o animación, con todos los cuadros del
  mismo tamaño.
- Audio: **.ogg** o **.mp3** cortos para efectos, y música en bucle.
- Archivos en `public/assets/img/` y `public/assets/audio/`, con nombres en minúsculas y con
  guiones (`jugador-caminar.png`, `fondo-piso-1.png`).

## 3. Lista de recursos que hacen falta

| Recurso          | Detalle                                                         | Prioridad |
| ---------------- | --------------------------------------------------------------- | --------- |
| Jugador          | Quieto y caminando en 4 direcciones                             | Alta      |
| Enemigo débil    | Quieto, caminando, recibiendo daño                              | Alta      |
| Bala             | Una imagen pequeña                                              | Alta      |
| Fondo del piso 1 | 2400×1920 px: piedra, barras metálicas, cajas de madera         | Alta      |
| Cofre            | Cerrado y abierto                                               | Alta      |
| Puerta           | Abierta, cerrada y con llave                                    | Media     |
| Jefe             | Quieto, ataque básico, ataque fuerte                            | Media     |
| Llave y mejoras  | Iconos para el HUD                                              | Media     |
| Portada          | Imagen de título                                                | Media     |
| Fondo del piso 2 | 2400×1920 px (por definir)                                      | Baja      |
| Sonidos          | Disparo, golpe, cofre, puerta, acierto, fallo, aviso del ataque | Media     |
| Música           | Una pista por piso y una para la portada                        | Baja      |

## 4. Cómo trabaja la lógica sin los recursos finales

Mientras los dibujos no estén listos, el código **genera texturas simples** (rectángulos y círculos
de colores) con una **clave** para cada recurso, por ejemplo `jugador`, `enemigo-debil`, `bala`,
`cofre`.

- El catálogo de claves vive en `src/datos/recursos.js`.
- Para cambiar un recurso provisional por el definitivo, solo se cambia su entrada en el catálogo
  (de "generado por código" a "archivo PNG"). **El resto del juego no cambia.**
- Así el equipo de lógica y el de dibujo trabajan a la vez sin esperarse.
