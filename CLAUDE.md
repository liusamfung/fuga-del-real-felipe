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
- El diseño está en `docs/diseno-del-juego.md`; el plan técnico en `docs/mapa-del-proyecto.md`.
- Phaser 4: el tiempo del QTE debe medirse en tiempo real, no con `time.timeScale`
  (el mundo va en cámara lenta, la barra no).
