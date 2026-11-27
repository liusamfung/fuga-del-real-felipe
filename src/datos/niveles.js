import { CONFIG } from '../config.js';
import { FOTOGRAMAS_TILESET, FOTOGRAMAS_TILESET_2 } from './recursos.js';

// Descripción de los niveles. Un nivel es una cuadrícula de salas; este archivo dice cómo es cada
// sala y dónde está el jefe. El generador (src/sistemas/GeneradorDeNivel.js) arma el nivel a partir
// de aquí y sortea en qué cofre está la llave.
//
// Todas las posiciones (x, y) son de la sala (su esquina de arriba a la izquierda es (0, 0)) y
// están en píxeles. Los obstáculos no se ponen en la cruz del centro de la sala (por donde se
// llega de una puerta a otra), y los enemigos nacen dentro de las paredes, lejos de las puertas y sin
// pisar un obstáculo ni a otro enemigo: lo comprueba pruebas/generadorDeNivel.test.js.

const { ANCHO, ALTO } = CONFIG.SALA;

const LADO_DE_CAJA = 64;
const cajas = (...posiciones) =>
	posiciones.map(([x, y]) => ({ x, y, ancho: LADO_DE_CAJA, alto: LADO_DE_CAJA }));

// El nido de ratas de una sala (ver src/entidades/Nido.js): ocupa el lugar de una de sus cajas. Devuelve los
// obstáculos SIN esa caja y el nido en su lugar; si la sala no tiene una caja ahí (la sala vacía), el nido
// es un obstáculo más. Se escribe con `...conNido(OBSTACULOS.esquinas, 96, 480)` dentro de la sala.
const conNido = (obstaculos, x, y) => ({
	obstaculos: obstaculos.filter((caja) => !(caja.x === x && caja.y === y)),
	nido: { x, y, ancho: LADO_DE_CAJA, alto: LADO_DE_CAJA },
});

// Un enemigo de un tipo (ver src/datos/enemigos.js) que nace en (x, y) de la sala.
const enemigo = (tipo, x, y) => ({ tipo, x, y });

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
	// Cómo se ven el suelo y las paredes: de qué hoja (`tileset`) y qué cuadro de ella se repite en cada una.
	estilo: Object.freeze({
		tileset: 'tileset',
		suelo: FOTOGRAMAS_TILESET.sueloRayas,
		pared: FOTOGRAMAS_TILESET.texturaRayasMarron,
	}),
	columnas: 3,
	filas: 3,
	salaInicial: { columna: 0, fila: 0 },
	salaDelJefe: { columna: 1, fila: 1 },

	// El jugador aparece en el centro de la sala inicial; el cofre sale en el centro de cada sala.
	posicionInicialDelJugador: { x: ANCHO / 2, y: ALTO / 2 },
	posicionDelCofre: { x: ANCHO / 2, y: ALTO / 2 },

	// Las 8 salas de alrededor: cada una tiene un cofre, un nido (en lugar de una de sus cajas) y SU PROPIA mezcla de enemigos, para que ninguna se
	// juegue igual que otra (los tipos están en src/datos/enemigos.js). La sala del jefe (la del centro) no
	// se describe aquí porque no tiene obstáculos, enemigos ni cofre. La sala inicial es la más suave.
	// Los enemigos nacen lejos de las puertas para no aparecer encima del jugador.
	salas: Object.freeze([
		{
			// Inicial: tres ratas grises (cada mordida quita 2 corazones) y su nido: la más suave, pero ya exige romper el nido.
			columna: 0,
			fila: 0,
			...conNido(OBSTACULOS.esquinas, 96, 480),
			enemigos: [
				enemigo('rata-gris', 112, 200),
				enemigo('rata-gris', 600, 488),
				enemigo('rata-gris', 592, 120),
			],
		},
		{
			// Tres ratas blancas: muy rápidas (aguantan 2 balas). Hay que apuntar rápido.
			columna: 1,
			fila: 0,
			...conNido(OBSTACULOS.diagonal, 544, 448),
			enemigos: [
				enemigo('rata-blanca', 656, 104),
				enemigo('rata-blanca', 656, 536),
				enemigo('rata-blanca', 160, 128),
			],
		},
		{
			// Una rata azul (lenta y resistente) con dos grises que se adelantan.
			columna: 2,
			fila: 0,
			...conNido(OBSTACULOS.pilares, 224, 416),
			enemigos: [
				enemigo('rata-azul', 680, 528),
				enemigo('rata-gris', 672, 144),
				enemigo('rata-gris', 160, 128),
			],
		},
		{
			// La plaga: seis ratas grises a la vez.
			columna: 0,
			fila: 1,
			...conNido(OBSTACULOS.laterales, 624, 384),
			enemigos: [
				enemigo('rata-gris', 128, 120),
				enemigo('rata-gris', 104, 536),
				enemigo('rata-gris', 640, 104),
				enemigo('rata-gris', 640, 504),
				enemigo('rata-gris', 344, 320),
				enemigo('rata-gris', 552, 296),
			],
		},
		{
			// Una rata negra (10 vidas y mata de un toque) acompañada de dos blancas veloces.
			columna: 2,
			fila: 1,
			...conNido(OBSTACULOS.esquinas, 96, 480),
			enemigos: [
				enemigo('rata-negra', 696, 424),
				enemigo('rata-blanca', 192, 136),
				enemigo('rata-blanca', 608, 136),
			],
		},
		{
			// Dos ratas azules que estorban y dos blancas (2 vidas, veloces): hay que decidir a quién disparar primero.
			columna: 0,
			fila: 2,
			...conNido(OBSTACULOS.diagonal, 192, 128),
			enemigos: [
				enemigo('rata-azul', 104, 480),
				enemigo('rata-azul', 632, 112),
				enemigo('rata-blanca', 112, 168),
				enemigo('rata-blanca', 648, 528),
			],
		},
		{
			// Un enemigo débil de los de siempre, una rata negra (la cazadora) y dos grises.
			columna: 1,
			fila: 2,
			...conNido(OBSTACULOS.vacia, 256, 176),
			enemigos: [
				enemigo('debil', 104, 536),
				enemigo('rata-negra', 664, 104),
				enemigo('rata-gris', 680, 528),
				enemigo('rata-gris', 160, 128),
			],
		},
		{
			// La más difícil: una de cada rata.
			columna: 2,
			fila: 2,
			...conNido(OBSTACULOS.pilares, 512, 416),
			enemigos: [
				enemigo('rata-gris', 688, 536),
				enemigo('rata-azul', 144, 528),
				enemigo('rata-blanca', 656, 128),
				enemigo('rata-negra', 120, 104),
			],
		},
	]),
});

// El nivel 2: la prisión. Las mismas 9 salas que el nivel 1 pero con el tileset azul-violeta de Jorge y con los
// GUARDIAS, que disparan (ver src/datos/enemigos.js): el azul es el tirador (mantiene la distancia y dispara una bala
// rápida) y el rojo el escopetero (avanza despacio y dispara un abanico tras un aviso largo). No hay nidos. Las
// cajas son cobertura: contra enemigos que disparan sirven para esconderse, no solo para estorbar.
// Los enemigos nacen en las posiciones ya comprobadas del nivel 1, sin pisar cajas ni puertas.
// La sala del jefe (la del centro) tiene al fantasma, igual que en el nivel 1 (ver `CONFIG.JEFES`).
export const NIVEL_2 = Object.freeze({
	nombre: 'Prisión',
	estilo: Object.freeze({
		tileset: 'tileset-2',
		suelo: FOTOGRAMAS_TILESET_2.sueloPunteado,
		pared: FOTOGRAMAS_TILESET_2.ranuras,
	}),
	columnas: 3,
	filas: 3,
	salaInicial: { columna: 0, fila: 0 },
	salaDelJefe: { columna: 1, fila: 1 },
	posicionInicialDelJugador: { x: ANCHO / 2, y: ALTO / 2 },
	posicionDelCofre: { x: ANCHO / 2, y: ALTO / 2 },

	salas: Object.freeze([
		{
			// Inicial: tres tiradores azules en tres esquinas. La más suave: ya enseña a rodear las cajas.
			columna: 0,
			fila: 0,
			obstaculos: OBSTACULOS.esquinas,
			enemigos: [
				enemigo('guardia-azul', 112, 200),
				enemigo('guardia-azul', 600, 488),
				enemigo('guardia-azul', 592, 120),
			],
		},
		{
			// Un escopetero que baja por la derecha con un tirador a cada lado.
			columna: 1,
			fila: 0,
			obstaculos: OBSTACULOS.diagonal,
			enemigos: [
				enemigo('guardia-rojo', 656, 104),
				enemigo('guardia-azul', 656, 536),
				enemigo('guardia-azul', 160, 128),
			],
		},
		{
			// Dos escopeteros y un tirador entre los pilares.
			columna: 2,
			fila: 0,
			obstaculos: OBSTACULOS.pilares,
			enemigos: [
				enemigo('guardia-rojo', 680, 528),
				enemigo('guardia-rojo', 672, 144),
				enemigo('guardia-azul', 160, 128),
			],
		},
		{
			// Fuego cruzado: cuatro tiradores, uno en cada rincón. No dejan de moverse para mantener la distancia.
			columna: 0,
			fila: 1,
			obstaculos: OBSTACULOS.laterales,
			enemigos: [
				enemigo('guardia-azul', 128, 120),
				enemigo('guardia-azul', 104, 536),
				enemigo('guardia-azul', 640, 104),
				enemigo('guardia-azul', 640, 504),
			],
		},
		{
			// Tres tiradores y un escopetero que espera junto a la caja de abajo.
			columna: 2,
			fila: 1,
			obstaculos: OBSTACULOS.esquinas,
			enemigos: [
				enemigo('guardia-rojo', 696, 424),
				enemigo('guardia-azul', 192, 136),
				enemigo('guardia-azul', 608, 136),
				enemigo('guardia-azul', 560, 250),
			],
		},
		{
			// Dos escopeteros y dos tiradores: hay que decidir a cuál rodear primero.
			columna: 0,
			fila: 2,
			obstaculos: OBSTACULOS.diagonal,
			enemigos: [
				enemigo('guardia-rojo', 104, 480),
				enemigo('guardia-rojo', 632, 112),
				enemigo('guardia-azul', 112, 168),
				enemigo('guardia-azul', 648, 528),
			],
		},
		{
			// Sin cajas: no hay dónde esconderse. Un tirador y tres escopeteros a campo abierto.
			columna: 1,
			fila: 2,
			obstaculos: OBSTACULOS.vacia,
			enemigos: [
				enemigo('guardia-azul', 104, 536),
				enemigo('guardia-rojo', 664, 104),
				enemigo('guardia-rojo', 680, 528),
				enemigo('guardia-rojo', 160, 128),
			],
		},
		{
			// La más difícil: tres escopeteros y dos tiradores entre los pilares (uno entre ellos, arriba del cofre).
			columna: 2,
			fila: 2,
			obstaculos: OBSTACULOS.pilares,
			enemigos: [
				enemigo('guardia-rojo', 688, 536),
				enemigo('guardia-rojo', 144, 528),
				enemigo('guardia-rojo', 120, 104),
				enemigo('guardia-azul', 656, 128),
				enemigo('guardia-azul', 400, 232), // entre los pilares, arriba del cofre del centro y a 232 px de la puerta
			],
		},
	]),
});

/** Los niveles del juego, por su número (1, 2…). */
export const NIVELES = Object.freeze({ 1: NIVEL_1, 2: NIVEL_2 });
