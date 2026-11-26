// Funciones puras para las explosiones y el vuelo de la granada. No dependen de Phaser, así se
// prueban con `npm test`. Los puntos son objetos con `x` e `y`, en píxeles.

/**
 * Los objetivos que quedan dentro del radio de una explosión (el borde cuenta como dentro). Cada
 * objetivo es un objeto con `x` e `y`; se devuelve la misma lista, filtrada y en el mismo orden.
 */
export function alcanzadosPorLaExplosion(centro, radio, objetivos) {
	return objetivos.filter((objetivo) => {
		const dx = objetivo.x - centro.x;
		const dy = objetivo.y - centro.y;
		return dx * dx + dy * dy <= radio * radio;
	});
}

/**
 * Cuánto tarda en llegar (en ms) algo que vuela en línea recta de un punto a otro a `velocidad`
 * (px/s). Nunca baja de `minimo`: una granada lanzada a los pies también se ve volar un instante.
 */
export function tiempoDeVuelo(origen, destino, velocidad, minimo = 0) {
	const distancia = Math.hypot(destino.x - origen.x, destino.y - origen.y);
	return Math.round(Math.max(minimo, (distancia / velocidad) * 1000));
}

/** El punto más cercano dentro del rectángulo { x, y, ancho, alto }: así la granada no cae fuera de la sala. */
export function limitarAlRectangulo(punto, { x, y, ancho, alto }) {
	return {
		x: Math.min(x + ancho, Math.max(x, punto.x)),
		y: Math.min(y + alto, Math.max(y, punto.y)),
	};
}
