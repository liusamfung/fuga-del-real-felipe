// Funciones puras sobre palabras y letras para el deletreo. No dependen de Phaser, del teclado ni
// del micrófono: lo que se escribe o se dice entra como texto. Se prueban con `npm test`.

import { MODOS_DE_DELETREO } from '../config.js';

const MARCAS_DE_TILDE = /[̀-ͯ]/g;

/**
 * La letra normalizada de un carácter: en mayúscula y sin tilde ni diéresis (Ó → O, Ü → U).
 * La Ñ se conserva: en español es otra letra, no una N con tilde.
 * Devuelve null si el carácter no es una letra suelta (un número, un espacio, 'Shift'…).
 */
export function normalizarLetra(caracter) {
	if (typeof caracter !== 'string' || [...caracter].length !== 1) {
		return null;
	}

	const mayuscula = caracter.toUpperCase();
	if (mayuscula === 'Ñ') {
		return 'Ñ';
	}

	// NFD separa la letra de su tilde (Ó → O + ´) y así se puede quitar la tilde.
	const sinTilde = mayuscula.normalize('NFD').replace(MARCAS_DE_TILDE, '');
	return /^[A-Z]$/.test(sinTilde) ? sinTilde : null;
}

/** Las letras de una palabra, normalizadas. Ignora lo que no es letra (espacios, guiones…). */
export function letrasDeLaPalabra(palabra) {
	return [...palabra].map(normalizarLetra).filter((letra) => letra !== null);
}

/**
 * Las letras en el orden en que hay que escribirlas o decirlas. Al revés, la palabra se
 * deletrea de la última letra a la primera: FERROCARRIL → L I R R A C O R R E F.
 */
export function letrasEsperadas(palabra, invertida = false) {
	const letras = letrasDeLaPalabra(palabra);
	return invertida ? letras.reverse() : letras;
}

/**
 * Cuánto tiempo (en ms) se da para deletrear una palabra: una base más un tiempo por cada letra.
 * Al revés es más difícil y se multiplica por `factorInvertida`. `factor` es un multiplicador
 * general (por ejemplo, más tiempo para la voz, que es más lenta que el teclado).
 */
export function tiempoParaLaPalabra(cantidadDeLetras, tiempos, invertida = false) {
	const { base, porLetra, factorInvertida = 1, factor = 1 } = tiempos;
	const tiempo = (base + cantidadDeLetras * porLetra) * factor;
	return Math.round(invertida ? tiempo * factorInvertida : tiempo);
}

/**
 * Cuánto tiempo (en ms) se ve la palabra antes de esconderla en los modos huecos y memoria: una base
 * más un tiempo por cada letra, lo justo para leerla una sola vez.
 */
export function tiempoDeLectura(cantidadDeLetras, { base, porLetra }) {
	return Math.round(base + cantidadDeLetras * porLetra);
}

/**
 * Qué se dibuja en el lugar de una letra de la palabra:
 *   'letra'  la letra misma
 *   'hueco'  un hueco (`_`), sin decir qué letra va
 *   'nada'   nada
 *
 * `orden` es el lugar de esa letra en el orden en que hay que escribirlas (0 la primera) e `indice`
 * cuántas van acertadas. Mientras se lee, y al terminar, la palabra se ve entera en todos los modos:
 * al fallar sirve para aprenderla. Solo durante el deletreo (estado 'activo') se esconde.
 *
 * El dictado es distinto: la palabra NO se ve mientras se oye (estado 'mostrando'), porque entonces
 * no habría nada que oír. Solo se ven los huecos y las letras acertadas, y al terminar la palabra
 * entera (así se aprende cómo se escribe).
 */
export function visibilidadDeLaLetra({ modo, estado, orden, indice }) {
	if (!Object.values(MODOS_DE_DELETREO).includes(modo)) {
		throw new Error(`Modo de deletreo desconocido: "${modo}"`);
	}

	if (modo === MODOS_DE_DELETREO.DICTADO) {
		const terminado = estado === 'acertada' || estado === 'fallada' || estado === 'tiempo-agotado';
		if (terminado) {
			return 'letra';
		}
		return orden < indice ? 'letra' : 'hueco';
	}

	if (modo === MODOS_DE_DELETREO.VISIBLE || estado !== 'activo') {
		return 'letra';
	}
	if (modo === MODOS_DE_DELETREO.HUECOS) {
		return orden < indice ? 'letra' : 'hueco';
	}
	return 'nada';
}
