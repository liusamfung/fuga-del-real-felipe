import { CONFIG } from '../config.js';

// Descripción de los niveles. Un nivel es una cuadrícula de salas; este archivo dice cómo es cada
// sala y dónde está el jefe. El generador (src/sistemas/GeneradorDeNivel.js) arma el nivel a partir
// de aquí y sortea en qué cofre está la llave.
//
// Todas las posiciones (x, y) son de la sala (su esquina de arriba a la izquierda es (0, 0)) y
// están en píxeles. Los obstáculos no se ponen en la cruz del centro de la sala (por donde se
// llega de una puerta a otra): lo comprueba pruebas/generadorDeNivel.test.js.

const { ANCHO, ALTO } = CONFIG.SALA;

const LADO_DE_CAJA = 64;
const cajas = (...posiciones) =>
	posiciones.map(([x, y]) => ({ x, y, ancho: LADO_DE_CAJA, alto: LADO_DE_CAJA }));

// Distribuciones de obstáculos que se repiten en varias salas.
const OBSTACULOS = Object.freeze({
	vacia: cajas(),
	esquinas: cajas([96, 96], [640, 96], [96, 480], [640, 480]),
	diagonal: cajas([192, 128], [544, 448]),
	pilares: cajas([224, 160], [512, 160], [224, 416], [512, 416]),
	laterales: cajas([112, 192], [624, 384]),
});

export const NIVEL_1 = Object.freeze({
	nombre: 'Mazmorras inferiores',
	columnas: 3,
	filas: 3,
	salaInicial: { columna: 0, fila: 0 },
	salaDelJefe: { columna: 1, fila: 1 },

	// El jugador aparece en el centro de la sala inicial; el cofre sale en el centro de cada sala.
	posicionInicialDelJugador: { x: ANCHO / 2, y: ALTO / 2 },
	posicionDelCofre: { x: ANCHO / 2, y: ALTO / 2 },

	// Las 8 salas de alrededor: cada una tiene un enemigo débil y un cofre. La sala del jefe
	// (la del centro) no se describe aquí porque no tiene obstáculos, enemigos ni cofre.
	// Los enemigos nacen lejos de las puertas para no aparecer encima del jugador.
	salas: Object.freeze([
		{ columna: 0, fila: 0, obstaculos: OBSTACULOS.esquinas, enemigo: { x: 600, y: 490 } },
		{ columna: 1, fila: 0, obstaculos: OBSTACULOS.diagonal, enemigo: { x: 200, y: 490 } },
		{ columna: 2, fila: 0, obstaculos: OBSTACULOS.pilares, enemigo: { x: 160, y: 150 } },
		{ columna: 0, fila: 1, obstaculos: OBSTACULOS.laterales, enemigo: { x: 600, y: 150 } },
		{ columna: 2, fila: 1, obstaculos: OBSTACULOS.esquinas, enemigo: { x: 200, y: 490 } },
		{ columna: 0, fila: 2, obstaculos: OBSTACULOS.diagonal, enemigo: { x: 600, y: 150 } },
		{ columna: 1, fila: 2, obstaculos: OBSTACULOS.vacia, enemigo: { x: 200, y: 150 } },
		{ columna: 2, fila: 2, obstaculos: OBSTACULOS.pilares, enemigo: { x: 160, y: 150 } },
	]),
});
