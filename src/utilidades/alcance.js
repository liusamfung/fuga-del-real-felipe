// El alcance de las balas del jugador. Es una función pura, sin Phaser: se prueba con `npm test`.

/**
 * ¿Una bala que salió de `origen` y ahora está en `posicion` ya llegó a su `alcance` (px)? El borde cuenta como llegó.
 * Se mide en línea recta desde donde salió, no por lo que ha volado: las balas van derechas.
 */
export function superoElAlcance(origen, posicion, alcance) {
	const dx = posicion.x - origen.x;
	const dy = posicion.y - origen.y;
	return dx * dx + dy * dy >= alcance * alcance;
}
