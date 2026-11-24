// Funciones puras para trabajar con direcciones. No dependen de Phaser.

/**
 * Convierte una dirección (x, y) en una de largo 1, para que ir en diagonal
 * no sea más rápido que ir recto. Si no hay dirección, devuelve (0, 0).
 */
export function normalizar(x, y) {
	const largo = Math.hypot(x, y);
	if (largo === 0) {
		return { x: 0, y: 0 };
	}
	return { x: x / largo, y: y / largo };
}
