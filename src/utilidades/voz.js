import { MAX_PALABRAS_POR_NOMBRE, NOMBRES_DE_LETRAS } from '../datos/nombresDeLetras.js';

// Convierte lo que "oye" el reconocedor de voz en letras. Son funciones puras: no usan el micrófono
// ni Phaser, así que se prueban con `npm test` y sirven igual con cualquier reconocedor.

const MARCAS_DE_TILDE = /[̀-ͯ]/g;

/**
 * Deja el texto en minúscula, sin tildes (la Ñ se conserva), sin signos y con un solo espacio entre
 * palabras: "¡Efe, E!" → "efe e".
 */
export function normalizarTexto(texto) {
	if (typeof texto !== 'string') {
		return '';
	}

	return texto
		.toLowerCase()
		.replace(/ñ/g, '§') // se esconde para que quitar tildes no la convierta en n
		.normalize('NFD')
		.replace(MARCAS_DE_TILDE, '')
		.replace(/§/g, 'ñ')
		.replace(/[^a-zñ\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Las letras que se dijeron en un texto, en orden. Cada letra es una lista de candidatas: casi
 * siempre una sola, pero "be" y "ve" suenan igual y dan ['B', 'V'].
 *
 * Los nombres de dos palabras ("doble ve", "i griega") ganan a los de una. Lo que no es el nombre
 * de una letra (por ejemplo, la palabra entera que el reconocedor se inventó) se ignora y se
 * devuelve aparte en `desconocidas`, para verlo en la prueba de voz.
 */
export function letrasDeLoDicho(texto) {
	const palabras = normalizarTexto(texto).split(' ').filter(Boolean);
	const letras = [];
	const desconocidas = [];

	let posicion = 0;
	while (posicion < palabras.length) {
		let candidatas = null;
		let usadas = 0;

		// Se prueba primero con el nombre más largo.
		for (let cantidad = MAX_PALABRAS_POR_NOMBRE; cantidad >= 1 && !candidatas; cantidad -= 1) {
			if (posicion + cantidad > palabras.length) {
				continue;
			}
			const nombre = palabras.slice(posicion, posicion + cantidad).join(' ');
			if (Object.hasOwn(NOMBRES_DE_LETRAS, nombre)) {
				candidatas = [...NOMBRES_DE_LETRAS[nombre]];
				usadas = cantidad;
			}
		}

		if (candidatas) {
			letras.push(candidatas);
			posicion += usadas;
		} else {
			desconocidas.push(palabras[posicion]);
			posicion += 1;
		}
	}

	return { letras, desconocidas };
}
