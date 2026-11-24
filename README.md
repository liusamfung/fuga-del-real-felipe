# Fuga del Real Felipe

Juego de acción 2D top-down, parecido a _The Binding of Isaac_, ambientado en el sitio del Callao
(1824–1826). Proyecto de Videojuegos I.

El jugador recorre las salas de un piso de la Fortaleza del Real Felipe, vence enemigos, abre
cofres que lo mejoran y busca la llave de la sala del jefe. Con la **voz** deletrea palabras para
lanzar poderes y sobrevivir a los ataques más fuertes del jefe.

> El título es provisional. El diseño completo está en [`docs/`](docs/README.md).

## Tecnología

- [Phaser](https://phaser.io/) 4
- [Vite](https://vite.dev/) 8
- JavaScript moderno con módulos ES
- ESLint y Prettier

## Cómo ejecutarlo

Necesitas Node.js 20.19 o superior y Git.

```bash
git clone https://github.com/liusamfung/fuga-del-real-felipe.git
cd fuga-del-real-felipe
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

### Modo de depuración

Abre el juego con `?debug` al final de la dirección: http://localhost:5173/?debug

- Muestra los cuerpos de choque (cuadros de colores) y la velocidad de los objetos.
- Deja el juego accesible desde la consola del navegador como `window.juego`.

## Cómo trabajar en equipo

La rama `main` está **protegida**: nadie puede subir cambios directamente a `main`. Todo cambio
entra con un _pull request_ (PR) que otro compañero debe aprobar. Así `main` siempre tiene una
versión que funciona.

### Flujo para cada cambio

1. **Actualiza `main`** antes de empezar:

   ```bash
   git switch main
   git pull
   ```

2. **Crea una rama** para tu tarea (una rama por tarea):

   ```bash
   git switch -c feat/movimiento-del-jugador
   ```

3. **Trabaja** y prueba con `npm run dev`. Antes de guardar tus cambios, revisa que todo pase:

   ```bash
   npm run format
   npm run lint
   npm run build
   ```

4. **Guarda tus cambios** con un mensaje corto en español, que diga qué hace el cambio:

   ```bash
   git add .
   git commit -m "Agrega el movimiento del jugador"
   ```

5. **Sube tu rama** (nunca `main`):

   ```bash
   git push -u origin feat/movimiento-del-jugador
   ```

6. **Abre un pull request** en GitHub hacia `main`. Explica qué cambia y cómo probarlo, y pide la
   revisión de un compañero.
7. **Cuando te aprueben**, usa **Squash and merge** y borra la rama.

### Nombres de rama

| Prefijo | Para qué                         | Ejemplo                      |
| ------- | -------------------------------- | ---------------------------- |
| `feat/` | Una función nueva del juego      | `feat/disparo-del-jugador`   |
| `fix/`  | Corregir un error                | `fix/colision-con-paredes`   |
| `docs/` | Documentación                    | `docs/duracion-de-niveles`   |
| `arte/` | Imágenes, audio y otros recursos | `arte/sprite-del-prisionero` |

### Reglas del equipo

- Haz PR pequeños: un cambio claro es más fácil de revisar que uno enorme.
- Revisa los PR de tus compañeros: lee los cambios, pruébalos y comenta o aprueba.
- Si tu rama tiene conflictos con `main`, trae los cambios nuevos y resuélvelos en tu rama:

  ```bash
  git switch main
  git pull
  git switch feat/movimiento-del-jugador
  git merge main
  ```

- No subas `node_modules/` ni `dist/` (Git ya los ignora).
- Sube solo imágenes y audio que podamos usar: propios o con licencia libre. Anota de dónde
  salen en el PR.
- Si dos personas necesitan el mismo archivo, avísense antes para evitar conflictos.

## Documentación

Todo está en [`docs/`](docs/README.md). Los más importantes:

- [Requisitos de la tarea](docs/requisitos-de-la-tarea.md): lo que pide el curso.
- [Diseño del juego](docs/diseno-del-juego.md): niveles, mapa 3×3, cofres, enemigos.
- [Mecánicas](docs/mecanicas.md): controles, disparo, dash y control de voz.
- [Mapa del proyecto](docs/mapa-del-proyecto.md): módulos de código y **hoja de ruta** para empezar.
- [Decisiones pendientes](docs/decisiones-pendientes.md): lo que falta decidir.

## Estructura

```
src/          Código del juego (escenas, entidades, sistemas, datos)
public/       Imágenes y audio que se copian tal cual
docs/         Diseño y planificación
```
