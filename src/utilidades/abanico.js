// Las direcciones de un abanico de proyectiles. Es una función pura, sin Phaser: se prueba con `npm test`.

/**
 * Reparte `cantidad` direcciones alrededor de `direccion` (un vector de largo 1), separadas `apertura` grados una
 * de otra y en orden de un lado al otro. Si la cantidad es impar, la del medio va justo en `direccion` (por
 * ejemplo, con 3: una a la izquierda, una al centro y una a la derecha). Cada resultado tiene largo 1.
 * La y crece hacia abajo, así que un ángulo positivo gira en el sentido de las agujas del reloj en pantalla.
 */
export function direccionesDelAbanico(direccion, cantidad, apertura) {
	const direcciones = [];
	for (let i = 0; i < cantidad; i += 1) {
		const giro = ((i - (cantidad - 1) / 2) * apertura * Math.PI) / 180;
		const cos = Math.cos(giro);
		const sin = Math.sin(giro);
		direcciones.push({
			x: direccion.x * cos - direccion.y * sin,
			y: direccion.x * sin + direccion.y * cos,
		});
	}
	return direcciones;
}
