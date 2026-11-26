// Dónde sale una rata de un nido. Es una función pura, sin Phaser: se prueba con `npm test`. Todas las
// medidas son de la sala (su esquina de arriba a la izquierda es (0, 0)), en píxeles.

const solapan = (a, b) =>
	a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;

/**
 * El punto (centro del cuerpo) donde sale la próxima rata de un nido: pegada al nido, en el primero de los
 * cuatro lados (abajo, arriba, derecha e izquierda) que tenga lugar libre, empezando por el más cercano al
 * centro de la sala, para que la rata salga hacia adentro y no se quede pegada a una pared.
 * Un lado tiene lugar libre si el cuerpo cabe dentro de las paredes y no pisa ningún obstáculo.
 *
 * @param nido `{ x, y, ancho, alto }`: el rectángulo del nido
 * @param obstaculos lista de rectángulos `{ x, y, ancho, alto }` que no se pueden pisar (cajas…)
 * @param sala `{ ancho, alto, grosor }`: el tamaño de la sala y lo que miden las paredes
 * @param cuerpo `{ ancho, alto }`: el tamaño del enemigo que sale
 * @param separacion píxeles de aire entre el nido y la rata al salir
 * @returns `{ x, y }`, o null si no cabe por ningún lado
 */
export function puntoDeSalidaDelNido(nido, obstaculos, sala, cuerpo, separacion = 4) {
	const medioAncho = cuerpo.ancho / 2;
	const medioAlto = cuerpo.alto / 2;
	const centroDelNido = { x: nido.x + nido.ancho / 2, y: nido.y + nido.alto / 2 };

	const candidatos = [
		{ x: centroDelNido.x, y: nido.y + nido.alto + separacion + medioAlto }, // abajo
		{ x: centroDelNido.x, y: nido.y - separacion - medioAlto }, // arriba
		{ x: nido.x + nido.ancho + separacion + medioAncho, y: centroDelNido.y }, // derecha
		{ x: nido.x - separacion - medioAncho, y: centroDelNido.y }, // izquierda
	];

	const interior = {
		x: sala.grosor,
		y: sala.grosor,
		ancho: sala.ancho - 2 * sala.grosor,
		alto: sala.alto - 2 * sala.grosor,
	};
	const centroDeLaSala = { x: sala.ancho / 2, y: sala.alto / 2 };
	const libres = candidatos.filter(({ x, y }) => {
		const rata = { x: x - medioAncho, y: y - medioAlto, ancho: cuerpo.ancho, alto: cuerpo.alto };
		const dentro =
			rata.x >= interior.x &&
			rata.y >= interior.y &&
			rata.x + rata.ancho <= interior.x + interior.ancho &&
			rata.y + rata.alto <= interior.y + interior.alto;
		return (
			dentro && !solapan(rata, nido) && !obstaculos.some((obstaculo) => solapan(rata, obstaculo))
		);
	});

	const distanciaAlCentro = (punto) =>
		Math.hypot(punto.x - centroDeLaSala.x, punto.y - centroDeLaSala.y);
	libres.sort((a, b) => distanciaAlCentro(a) - distanciaAlCentro(b));
	return libres[0] ?? null;
}
