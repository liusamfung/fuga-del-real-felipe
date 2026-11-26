import { normalizarTexto } from './voz.js';

// Elegir, entre las opciones de una ficha, la que el jugador dijo en voz alta. Son funciones puras:
// no usan el micrófono ni Phaser, así que se prueban con `npm test`.
//
// Lo que oye el navegador casi nunca es perfecto (el acento cambia una letra: "dancer" por "danger").
// Como las opciones de una ficha son siempre palabras muy distintas entre sí, no hace falta que el
// navegador acierte la palabra: basta con que lo oído se parezca más a una opción que a las otras.

/** Número de ediciones (poner, quitar o cambiar una letra) para pasar de una palabra a otra. */
export function distanciaDeEdicion(a, b) {
	const letrasA = [...a];
	const letrasB = [...b];
	let anterior = Array.from({ length: letrasB.length + 1 }, (_, columna) => columna);

	for (let fila = 1; fila <= letrasA.length; fila += 1) {
		const actual = [fila];
		for (let columna = 1; columna <= letrasB.length; columna += 1) {
			const costoDeCambio = letrasA[fila - 1] === letrasB[columna - 1] ? 0 : 1;
			actual[columna] = Math.min(
				anterior[columna] + 1, // quitar una letra
				actual[columna - 1] + 1, // poner una letra
				anterior[columna - 1] + costoDeCambio, // cambiar una letra
			);
		}
		anterior = actual;
	}

	return anterior[letrasB.length];
}

/**
 * Cuántas ediciones se perdonan al comparar con una palabra: una por cada `letrasPorError` letras, y
 * siempre al menos una. Con 3: "run" admite 1, "danger" admite 2.
 */
export function toleranciaPara(palabra, letrasPorError = 3) {
	return Math.max(1, Math.floor([...palabra].length / letrasPorError));
}

/**
 * Decide qué opción dijo el jugador.
 *
 * `alternativas` son los textos que oyó el navegador (todas las alternativas de todos los resultados);
 * `opciones` son las palabras entre las que se elige. Devuelve:
 *   { indice, opcion, distancia, exacta, distancias }   si hay una sola opción que encaje
 *   { indice: -1, motivo }                              si no: 'nada' (no se oyó nada), 'ninguna'
 *                                                       (lo oído no se parece a ninguna opción) o
 *                                                       'ambigua' (encajan dos por igual, por ejemplo
 *                                                       si el jugador dijo dos opciones)
 */
export function elegirOpcion(alternativas, opciones, { letrasPorError = 3 } = {}) {
	const textos = alternativas.map(normalizarTexto).filter(Boolean);
	if (textos.length === 0) {
		return { indice: -1, motivo: 'nada' };
	}

	// Se compara con cada texto entero (por si la opción tiene dos palabras) y con cada palabra suelta
	// ("the danger" también vale).
	const candidatos = [...new Set(textos.flatMap((texto) => [texto, ...texto.split(' ')]))];
	const normalizadas = opciones.map(normalizarTexto);
	const distancias = normalizadas.map((opcion) =>
		Math.min(...candidatos.map((candidato) => distanciaDeEdicion(candidato, opcion))),
	);

	const dentro = distancias
		.map((distancia, indice) => ({ distancia, indice }))
		.filter(
			({ distancia, indice }) => distancia <= toleranciaPara(normalizadas[indice], letrasPorError),
		);
	if (dentro.length === 0) {
		return { indice: -1, motivo: 'ninguna', distancias };
	}

	const mejor = Math.min(...dentro.map(({ distancia }) => distancia));
	const empatadas = dentro.filter(({ distancia }) => distancia === mejor);
	if (empatadas.length > 1) {
		return { indice: -1, motivo: 'ambigua', distancias };
	}

	const [{ indice, distancia }] = empatadas;
	return { indice, opcion: opciones[indice], distancia, exacta: distancia === 0, distancias };
}

/**
 * ¿Las opciones son completamente distintas? Ninguna empieza con la misma letra que otra, ninguna
 * contiene a otra y todas están a `distanciaMinima` ediciones o más. Es una regla de diseño de las
 * fichas: si dos opciones se parecen, el reconocedor (o el jugador) las puede confundir.
 */
export function opcionesDistintas(opciones, distanciaMinima = 3) {
	const normalizadas = opciones.map(normalizarTexto);
	for (let i = 0; i < normalizadas.length; i += 1) {
		for (let j = i + 1; j < normalizadas.length; j += 1) {
			const [a, b] = [normalizadas[i], normalizadas[j]];
			const mismaInicial = a[0] === b[0];
			const unaContieneALaOtra = a.includes(b) || b.includes(a);
			if (mismaInicial || unaContieneALaOtra || distanciaDeEdicion(a, b) < distanciaMinima) {
				return false;
			}
		}
	}
	return true;
}
