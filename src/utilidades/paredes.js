// Funciones puras sobre la forma de una sala: sus paredes y sus puertas. No dependen de Phaser.
//
// Las medidas de la sala son un objeto { ancho, alto, grosor, anchoPuerta } (ver CONFIG.SALA) y
// los rectángulos que devuelven están en coordenadas de la sala: (0, 0) es su esquina de arriba
// a la izquierda.

export const LADOS = Object.freeze(['arriba', 'derecha', 'abajo', 'izquierda']);

const OPUESTOS = Object.freeze({
	arriba: 'abajo',
	abajo: 'arriba',
	izquierda: 'derecha',
	derecha: 'izquierda',
});

/** El lado de la sala vecina por el que se llega a esta: la puerta de arriba da a la de abajo. */
export function ladoOpuesto(lado) {
	return OPUESTOS[lado];
}

/** Rectángulo del hueco de la puerta de ese lado: centrado en la pared y tan grueso como ella. */
export function rectanguloDePuerta(lado, { ancho, alto, grosor, anchoPuerta }) {
	const x = (ancho - anchoPuerta) / 2;
	const y = (alto - anchoPuerta) / 2;

	switch (lado) {
		case 'arriba':
			return { x, y: 0, ancho: anchoPuerta, alto: grosor };
		case 'abajo':
			return { x, y: alto - grosor, ancho: anchoPuerta, alto: grosor };
		case 'izquierda':
			return { x: 0, y, ancho: grosor, alto: anchoPuerta };
		case 'derecha':
			return { x: ancho - grosor, y, ancho: grosor, alto: anchoPuerta };
		default:
			throw new Error(`Lado desconocido: ${lado}`);
	}
}

/**
 * Rectángulos de las paredes de la sala. En cada lado de `lados` la pared tiene un hueco para
 * la puerta (dos rectángulos en vez de uno).
 */
export function segmentosDeParedes(sala, lados) {
	const { ancho, alto, grosor, anchoPuerta } = sala;
	const conPuerta = new Set(lados);
	const inicioHorizontal = (ancho - anchoPuerta) / 2; // donde empieza el hueco, arriba y abajo
	const inicioVertical = (alto - anchoPuerta) / 2; // donde empieza el hueco, a los lados
	const segmentos = [];

	// Paredes de arriba y de abajo: ocupan todo el ancho, esquinas incluidas.
	for (const lado of ['arriba', 'abajo']) {
		const y = lado === 'arriba' ? 0 : alto - grosor;
		if (conPuerta.has(lado)) {
			segmentos.push(
				{ x: 0, y, ancho: inicioHorizontal, alto: grosor },
				{ x: inicioHorizontal + anchoPuerta, y, ancho: inicioHorizontal, alto: grosor },
			);
		} else {
			segmentos.push({ x: 0, y, ancho, alto: grosor });
		}
	}

	// Paredes de la izquierda y de la derecha: van entre las de arriba y abajo.
	for (const lado of ['izquierda', 'derecha']) {
		const x = lado === 'izquierda' ? 0 : ancho - grosor;
		if (conPuerta.has(lado)) {
			const finDelHueco = inicioVertical + anchoPuerta;
			segmentos.push(
				{ x, y: grosor, ancho: grosor, alto: inicioVertical - grosor },
				{ x, y: finDelHueco, ancho: grosor, alto: alto - grosor - finDelHueco },
			);
		} else {
			segmentos.push({ x, y: grosor, ancho: grosor, alto: alto - 2 * grosor });
		}
	}

	return segmentos;
}
