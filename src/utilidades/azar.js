// Funciones puras para elegir al azar. No dependen de Phaser.

/**
 * Elige un elemento de la lista con la misma probabilidad para todos.
 * `azar` devuelve un número en [0, 1); se puede reemplazar para probar con valores fijos.
 */
export function elegirAlAzar(lista, azar = Math.random) {
	return lista[Math.floor(azar() * lista.length)];
}

/** Copia de la lista con el orden al azar (Fisher-Yates). No cambia la lista original. */
export function barajar(lista, azar = Math.random) {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i -= 1) {
		const j = Math.floor(azar() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}
