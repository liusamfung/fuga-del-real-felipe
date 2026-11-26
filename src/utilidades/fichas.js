import { barajar, elegirAlAzar } from './azar.js';
import { elegirOpcion, opcionesDistintas } from './opciones.js';

// Arma las fichas de los retos de inglés a partir del banco de vocabulario (src/datos/vocabulario.js).
// Son funciones puras: no usan Phaser ni el micrófono, así que se prueban con `npm test`.
//
//   nivel 1  traducción: se ve la palabra en español y se dice su traducción entre tres opciones.
//   nivel 2  definición: se ve la definición en inglés y se dice la palabra entre tres opciones.
//   nivel 3  dictado: el juego dice la palabra y el jugador la escribe (no hay opciones).

export const NIVELES_DE_INGLES = Object.freeze({ TRADUCCION: 1, DEFINICION: 2, DICTADO: 3 });

const OPCIONES_POR_FICHA = 3;

/** ¿El texto se parece a la palabra? (Si el enunciado se parece a una opción, se acierta leyéndolo.) */
function seParece(texto, palabra) {
	return elegirOpcion([texto], [palabra]).indice === 0;
}

/**
 * Elige las opciones equivocadas de una ficha. Salen de otras palabras del banco, con estas reglas:
 *  - de una categoría distinta a la de la respuesta y distinta entre sí (así ninguna podría ser
 *    también la respuesta);
 *  - completamente distintas entre sí y de la respuesta (ver `opcionesDistintas`);
 *  - que no se parezcan al enunciado (si la definición dice "carrots", "carrot" no puede ser opción).
 * Devuelve las palabras equivocadas, o null si el banco no alcanza para armar la ficha.
 */
function elegirEquivocadas(entrada, enunciado, vocabulario, azar) {
	const candidatas = barajar(
		vocabulario.filter((otra) => !seParece(enunciado, otra.palabra)),
		azar,
	);

	// La respuesta ya está en `elegidas`: por eso se descartan ella misma y su categoría.
	const elegidas = [entrada];
	for (const candidata of candidatas) {
		const categoriaRepetida = elegidas.some((e) => e.categoria === candidata.categoria);
		if (
			!categoriaRepetida &&
			opcionesDistintas([...elegidas.map((e) => e.palabra), candidata.palabra])
		) {
			elegidas.push(candidata);
		}
		if (elegidas.length === OPCIONES_POR_FICHA) {
			return elegidas.slice(1).map((e) => e.palabra);
		}
	}
	return null;
}

/**
 * Arma la ficha de un nivel para una palabra del banco.
 *
 *   niveles 1 y 2  { nivel, tipo, enunciado, opciones, correcta }   (`correcta` es la posición en `opciones`)
 *   nivel 3        { nivel, tipo: 'dictado', palabra }
 *
 * Devuelve null si el banco no alcanza para armar las opciones (con 60 palabras no pasa).
 */
export function armarFicha(entrada, nivel, vocabulario, azar = Math.random) {
	if (nivel === NIVELES_DE_INGLES.DICTADO) {
		return { nivel, tipo: 'dictado', palabra: entrada.palabra };
	}

	const esTraduccion = nivel === NIVELES_DE_INGLES.TRADUCCION;
	if (!esTraduccion && nivel !== NIVELES_DE_INGLES.DEFINICION) {
		throw new Error(`Nivel de inglés desconocido: ${nivel}`);
	}

	const enunciado = esTraduccion ? entrada.traduccion : entrada.definicion;
	const equivocadas = elegirEquivocadas(entrada, enunciado, vocabulario, azar);
	if (!equivocadas) {
		return null;
	}

	const opciones = barajar([entrada.palabra, ...equivocadas], azar);
	return {
		nivel,
		tipo: esTraduccion ? 'traduccion' : 'definicion',
		enunciado,
		opciones,
		correcta: opciones.indexOf(entrada.palabra),
	};
}

/**
 * Elige una palabra del banco al azar. `libros` (opcional) limita a esos libros del mazo (1 o 2 por
 * ahora); `evitar` es una lista de palabras que no deben salir (las últimas que salieron). Si `evitar`
 * deja el banco vacío, se ignora: antes repetir una palabra que quedarse sin ninguna.
 * Devuelve null si no hay ninguna palabra en esos libros.
 */
export function elegirEntrada(vocabulario, { libros, evitar = [], azar = Math.random } = {}) {
	const delLibro = libros
		? vocabulario.filter((entrada) => libros.includes(entrada.libro))
		: vocabulario;
	if (delLibro.length === 0) {
		return null;
	}

	const sinRepetir = delLibro.filter((entrada) => !evitar.includes(entrada.palabra));
	return elegirAlAzar(sinRepetir.length > 0 ? sinRepetir : delLibro, azar);
}
