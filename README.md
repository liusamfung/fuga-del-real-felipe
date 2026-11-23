# Fuga del Real Felipe

Juego 2D top-down de escape ambientado en el sitio del Callao (1824–1826). Proyecto de
Videojuegos I.

Un prisionero ficticio debe escapar de las mazmorras de la Fortaleza del Real Felipe. No hay
combate: el peligro se resuelve con **eventos de reacción** ("!") que se contestan con el
teclado o con la voz.

> El título es provisional. El diseño completo está en [`docs/diseno-del-juego.md`](docs/diseno-del-juego.md).

## Tecnología

- [Phaser](https://phaser.io/) 4
- [Vite](https://vite.dev/) 8
- JavaScript moderno con módulos ES
- ESLint y Prettier

## Cómo ejecutarlo

Necesitas Node.js 20.19 o superior.

```bash
npm install
```

```bash
npm run dev
```

El juego se abre en http://localhost:5173.

## Comandos

| Comando           | Qué hace                                      |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga automática |
| `npm run build`   | Genera la versión para publicar en `dist/`    |
| `npm run preview` | Prueba la versión generada                    |
| `npm run lint`    | Revisa el código con ESLint                   |
| `npm run format`  | Da formato a los archivos con Prettier        |

## Documentación

- [Documento de diseño](docs/diseno-del-juego.md): qué es el juego (del borrador del equipo).
- [Mapa del proyecto](docs/mapa-del-proyecto.md): qué módulos de código lo implementan y en qué orden.

## Estructura

```
src/          Código del juego (escenas, entidades, sistemas, datos)
public/       Imágenes y audio que se copian tal cual
docs/         Diseño y planificación
```
