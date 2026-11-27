// Funciones puras para las explosiones y el vuelo de la granada. No dependen de Phaser, así se
// prueban con `npm test`. Los puntos son objetos con `x` e `y`, en píxeles.

/**
 * Los objetivos que toca una explosión (el borde cuenta como tocar). Cada objetivo es un objeto con `x` e `y` (su
 * centro) y, si tiene cuerpo, también `ancho` y `alto`: entonces cuenta el rectángulo entero, no solo el centro, y
 * basta con que el círculo roce una esquina. Sin `ancho` ni `alto` es un punto. Se devuelve la misma lista, filtrada y
 * en el mismo orden.
 */
export function alcanzadosPorLaExplosion(centro, radio, objetivos) {
	return objetivos.filter((objetivo) => {
		// Distancia del centro de la explosión al punto más cercano del cuerpo (0 en el eje en que está dentro).
		const dx = Math.max(Math.abs(objetivo.x - centro.x) - (objetivo.ancho ?? 0) / 2, 0);
		const dy = Math.max(Math.abs(objetivo.y - centro.y) - (objetivo.alto ?? 0) / 2, 0);
		return dx * dx + dy * dy <= radio * radio;
	});
}

/**
 * El cuerpo físico de Phaser (`{ center: { x, y }, width, height }`) como el objetivo que entiende
 * `alcanzadosPorLaExplosion`: su centro, su ancho y su alto.
 */
export function rectanguloDelCuerpo({ center, width, height }) {
	return { x: center.x, y: center.y, ancho: width, alto: height };
}

/**
 * Los tramos de una línea de rayas entre dos puntos: rayas de `raya` px separadas por huecos de `hueco` px, empezando
 * con una raya. Devuelve una lista de `{ desde, hasta }`; la última raya se corta donde acaba la línea. Se usa para
 * dibujar la vista previa de la granada. Una línea de largo cero no tiene tramos.
 */
export function tramosDeRayas(origen, destino, raya, hueco) {
	const largo = Math.hypot(destino.x - origen.x, destino.y - origen.y);
	if (largo === 0) {
		return [];
	}

	const ux = (destino.x - origen.x) / largo;
	const uy = (destino.y - origen.y) / largo;
	const tramos = [];
	for (let inicio = 0; inicio < largo; inicio += raya + hueco) {
		const fin = Math.min(inicio + raya, largo);
		tramos.push({
			desde: { x: origen.x + ux * inicio, y: origen.y + uy * inicio },
			hasta: { x: origen.x + ux * fin, y: origen.y + uy * fin },
		});
	}
	return tramos;
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
