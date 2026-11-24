# Fuga del Real Felipe

Juego 2D top-down hecho con Phaser 4 + Vite. Proyecto universitario de Videojuegos I.

## Idioma

Este proyecto usa **español** para commits, README, comentarios, documentación y texto del juego.
Los identificadores del código también van en español (`EscenaArranque`, `Jugador`), igual que
en el resto de la asignatura. Los nombres propios de la API de Phaser se quedan en inglés.

## Comandos

- `npm run dev`: servidor de desarrollo
- `npm run build`: compilación para publicar
- `npm run lint` y `npm run format`: calidad del código

## Convenciones

- Módulos ES con extensión `.js` en los `import` (`import { CONFIG } from './config.js'`).
- Un archivo por clase; el nombre del archivo es el de la clase.
- Los valores numéricos del juego van en `src/config.js` o en `src/datos/`, no dentro de las clases.
- El diseño está en `docs/diseno-del-juego.md` y `docs/mecanicas.md`; el plan técnico y la hoja de
  ruta en `docs/mapa-del-proyecto.md`. Lo que falta decidir está en `docs/decisiones-pendientes.md`.
- Medidas: cada sala mide 800×640 px, el nivel es una cuadrícula de 3×3 salas (2400×1920 px).
- Mientras no existan los sprites finales, se usan texturas provisionales generadas por código con
  las mismas claves que tendrán los recursos finales (`docs/guia-de-recursos.md`).
- La lógica del deletreo (`src/utilidades/deletreo.js`) debe ser pura, sin Phaser ni micrófono, para
  poder probarla con tests.
- Phaser 4: el tiempo de la palabra a deletrear debe medirse en tiempo real, no con
  `time.timeScale` (el mundo va en cámara lenta, la barra no).
- El modo multijugador que pide la tarea está **aplazado**: no se programa nada de red ni de varios
  jugadores a menos que el profesor lo exija (se haría al final).
