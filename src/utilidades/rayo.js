// Funciones puras para el rayo del ataque fuerte del jefe: hasta dónde llega y hacia qué lado esquivarlo.
// No dependen de Phaser, así se prueban con `npm test`. Los puntos son objetos `{ x, y }` en píxeles, las
// direcciones son vectores de largo 1 y un rectángulo es `{ x, y, ancho, alto }` (la y crece hacia abajo).

/**
 * Cuánto mide un rayo que sale de `origen` hacia `direccion` hasta tocar el borde del rectángulo: así llega
 * «hasta el final de la sala» en cualquier dirección, también en diagonal. Si el origen está fuera del
 * rectángulo (o no hay dirección) devuelve 0.
 */
export function largoHastaElBorde(origen, direccion, { x, y, ancho, alto }) {
	let largo = Infinity;

	if (direccion.x > 0) {
		largo = Math.min(largo, (x + ancho - origen.x) / direccion.x);
	} else if (direccion.x < 0) {
		largo = Math.min(largo, (x - origen.x) / direccion.x);
	}
	if (direccion.y > 0) {
		largo = Math.min(largo, (y + alto - origen.y) / direccion.y);
	} else if (direccion.y < 0) {
		largo = Math.min(largo, (y - origen.y) / direccion.y);
	}

	return Number.isFinite(largo) ? Math.max(0, largo) : 0;
}

/**
 * Hacia dónde debe lanzarse el jugador para salir del camino de un rayo: perpendicular al rayo, hacia el lado
 * que tiene más espacio hasta la pared (así el impulso no se frena contra ella). Si los dos lados tienen el
 * mismo espacio, gira a la izquierda del rayo. Devuelve un vector de largo 1.
 *
 * @param direccion hacia dónde va el rayo
 * @param jugador dónde está el jugador
 * @param limites el rectángulo por el que se puede mover (el interior de la sala)
 */
export function ladoDeEsquive(direccion, jugador, limites) {
	// `0 - n` y no `-n`: así un 0 no se convierte en -0.
	const izquierda = { x: direccion.y, y: 0 - direccion.x };
	const derecha = { x: 0 - direccion.y, y: direccion.x };

	return largoHastaElBorde(jugador, derecha, limites) >
		largoHastaElBorde(jugador, izquierda, limites)
		? derecha
		: izquierda;
}

/** A qué distancia de la línea del rayo (que pasa por `origen` en `direccion`) está un punto. */
export function distanciaALaLinea(punto, origen, direccion) {
	return Math.abs((punto.x - origen.x) * direccion.y - (punto.y - origen.y) * direccion.x);
}
