import { CONFIG } from '../config.js';

// Sala de prueba para desarrollar el movimiento y los choques.
// Más adelante cada sala de un nivel tendrá su propia descripción como esta.
// Todas las posiciones (x, y) están dentro de la sala y en píxeles.

const { ANCHO, ALTO, CASILLA } = CONFIG.SALA;

export const SALA_DE_PRUEBA = Object.freeze({
	paredes: [
		{ x: 0, y: 0, ancho: ANCHO, alto: CASILLA }, // arriba
		{ x: 0, y: ALTO - CASILLA, ancho: ANCHO, alto: CASILLA }, // abajo
		{ x: 0, y: CASILLA, ancho: CASILLA, alto: ALTO - 2 * CASILLA }, // izquierda
		{ x: ANCHO - CASILLA, y: CASILLA, ancho: CASILLA, alto: ALTO - 2 * CASILLA }, // derecha
	],
	obstaculos: [
		{ x: 192, y: 160, ancho: 64, alto: 64 },
		{ x: 544, y: 384, ancho: 64, alto: 64 },
		{ x: 352, y: 448, ancho: 64, alto: 64 },
	],
	enemigos: [
		{ x: 620, y: 140 },
		{ x: 180, y: 470 },
	],
	jugadorInicial: { x: ANCHO / 2, y: ALTO / 2 },
});
