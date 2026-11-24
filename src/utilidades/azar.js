// Funciones puras para elegir al azar. No dependen de Phaser.

/**
 * Elige un elemento de la lista con la misma probabilidad para todos.
 * `azar` devuelve un número en [0, 1); se puede reemplazar para probar con valores fijos.
 */
export function elegirAlAzar(lista, azar = Math.random) {
	return lista[Math.floor(azar() * lista.length)];
}
