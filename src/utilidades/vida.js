// Las reglas de la vida del jugador. Son funciones puras, sin Phaser: se prueban con `npm test`.
//
// El jugador tiene dos clases de corazones:
//   - Los BASE (`vida`, de `vidaMaxima`, que son 3): los de siempre. Los perdidos se ven en gris y no vuelven.
//   - Los EXTRA (`vidaExtra`): los que da un cofre. Son temporales: se dibujan aparte (azules) y se pierden al recibir daño.
// El daño pasa primero por los extra, como un escudo, y solo cuando no queda ninguno toca los corazones base. El jugador
// muere cuando los base llegan a cero.

/**
 * Aplica `cantidad` corazones de daño. Primero se gastan los extra y lo que sobre se resta de los base (sin bajar de 0).
 * Devuelve `{ vida, vidaExtra }`, los valores nuevos; no cambia el objeto que recibe.
 */
export function aplicarDano({ vida, vidaExtra }, cantidad) {
	const absorbido = Math.min(vidaExtra, cantidad);
	return {
		vida: Math.max(0, vida - (cantidad - absorbido)),
		vidaExtra: vidaExtra - absorbido,
	};
}

/** Cuántos corazones se dibujan en total: los base (llenos o grises) más los extra. */
export function corazonesAMostrar({ vidaMaxima, vidaExtra }) {
	return vidaMaxima + vidaExtra;
}
