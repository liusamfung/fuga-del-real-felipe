import { elegirAlAzar } from '../utilidades/azar.js';

// Banco de palabras para deletrear. Salen de la historia real del sitio del Callao (1824–1826),
// para que el juego "genere impacto" y enseñe algo. Se muestran con tildes; al comparar, las tildes
// no importan (ver src/utilidades/deletreo.js). Los grupos son por dificultad, y los valores son
// iniciales: se afinan con las pruebas de voz (paso 8).

export const PALABRAS = Object.freeze({
	facil: Object.freeze(['RODIL', 'CALLAO', 'FUERTE', 'CAÑÓN']),
	media: Object.freeze(['FORTALEZA', 'BASTIÓN', 'PÓLVORA', 'ASEDIO']),
	dificil: Object.freeze(['CAPITULACIÓN', 'INDEPENDENCIA', 'ARTILLERÍA', 'FERROCARRIL']),
});

export const DIFICULTADES = Object.freeze(Object.keys(PALABRAS));

/** Una palabra al azar de esa dificultad: 'facil', 'media' o 'dificil'. */
export function elegirPalabra(dificultad, azar = Math.random) {
	const grupo = PALABRAS[dificultad];
	if (!grupo) {
		throw new Error(`Dificultad desconocida: "${dificultad}"`);
	}
	return elegirAlAzar(grupo, azar);
}
