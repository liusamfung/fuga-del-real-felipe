// Catálogo del audio del juego: la música de cada nivel y los efectos. Igual que con las imágenes, el juego usa siempre
// la clave y nunca la ruta (`sonido.efecto('jugador-disparo')`), así cambiar un archivo por uno mejor es poner el nuevo
// con el mismo nombre en public/assets/audio/. Hoy son sonidos propios generados por código
// (`npm run audio`, herramientas/generar-audio.js); ver docs/audio.md.
//
//   ruta        el archivo dentro de public/
//   tipo        'musica' (se repite en bucle y solo suena una a la vez) o 'efecto'
//   volumen     de 0 a 1: qué tan fuerte suena respecto al máximo. La música va más baja para que los efectos se oigan.
//   separacion  (efectos) ms mínimos entre dos repeticiones: si el juego lo pide más seguido, se ignora. Así una
//               ráfaga de balas o una rata mordiendo no se convierten en ruido.
//   variacion   (efectos) cuánto cambia el tono al azar cada vez, en centésimas de semitono: que dos disparos seguidos
//               no suenen idénticos.
//   duracion    cuánto debe durar el archivo, en segundos: `{ min, max }`. Lo comprueban las pruebas.

export const AUDIOS = Object.freeze({
	'musica-nivel-1': {
		ruta: 'assets/audio/musica-nivel-1.mp3',
		tipo: 'musica',
		volumen: 0.3,
		duracion: { min: 60, max: 120 },
	},
	'musica-nivel-2': {
		ruta: 'assets/audio/musica-nivel-2.mp3',
		tipo: 'musica',
		volumen: 0.3,
		duracion: { min: 60, max: 120 },
	},

	'jugador-disparo': {
		ruta: 'assets/audio/jugador-disparo.mp3',
		tipo: 'efecto',
		volumen: 0.35, // se oye cada 0,25 s: suave
		separacion: 60,
		variacion: 80,
		duracion: { min: 0.05, max: 0.5 },
	},
	'jugador-dano': {
		ruta: 'assets/audio/jugador-dano.mp3',
		tipo: 'efecto',
		volumen: 0.75,
		separacion: 150,
		variacion: 0,
		duracion: { min: 0.1, max: 1 },
	},

	'jugador-muerte': {
		ruta: 'assets/audio/jugador-muerte.mp3',
		tipo: 'efecto',
		volumen: 0.85,
		separacion: 1000,
		variacion: 0,
		duracion: { min: 0.8, max: 3 },
	},

	'guardia-escopeta-disparo': {
		ruta: 'assets/audio/guardia-escopeta-disparo.mp3',
		tipo: 'efecto',
		volumen: 0.6,
		separacion: 80,
		variacion: 60,
		duracion: { min: 0.1, max: 1 },
	},
	'guardia-rifle-disparo': {
		ruta: 'assets/audio/guardia-rifle-disparo.mp3',
		tipo: 'efecto',
		volumen: 0.5,
		separacion: 60,
		variacion: 60,
		duracion: { min: 0.1, max: 1 },
	},

	'rata-ataque': {
		ruta: 'assets/audio/rata-ataque.mp3',
		tipo: 'efecto',
		volumen: 0.45,
		separacion: 350, // una rata sobre el jugador toca en cada fotograma: así suena a mordiscos, no a un zumbido
		variacion: 150,
		duracion: { min: 0.1, max: 1 },
	},

	'fantasma-ataque-basico': {
		ruta: 'assets/audio/fantasma-ataque-basico.mp3',
		tipo: 'efecto',
		volumen: 0.55,
		separacion: 200,
		variacion: 40,
		duracion: { min: 0.1, max: 1.5 },
	},
	'fantasma-ataque-fuerte': {
		ruta: 'assets/audio/fantasma-ataque-fuerte.mp3',
		tipo: 'efecto',
		volumen: 0.8,
		separacion: 500,
		variacion: 0,
		duracion: { min: 1, max: 3 },
	},
});

/** La clave de la música de un nivel (`musica-nivel-1`, `musica-nivel-2`…). */
export const claveDeLaMusicaDelNivel = (numero) => `musica-nivel-${numero}`;
