// Catálogo de recursos: la clave de cada imagen y de dónde sale. El resto del juego usa siempre
// la clave, nunca la ruta. Hay tres tipos de recurso:
//
//   - 'hoja': una hoja de sprites (varios cuadros del mismo tamaño en un solo PNG). Es el formato
//     de los dibujos finales. `ancho` y `alto` son el tamaño de UN cuadro.
//   - 'imagen': un PNG suelto.
//   - 'generado': un dibujo provisional hecho por código con rectángulos de colores, para trabajar
//     mientras no existe el dibujo final. Los colores de cada forma son 0xRRGGBB.
//
// Para cambiar un recurso provisional por el definitivo solo se cambia su entrada, por ejemplo:
//
//   cofre-cerrado: { tipo: 'imagen', ruta: 'assets/img/objetos/cofre-cerrado.png' },
//
// Cómo se arman y nombran las hojas: docs/guia-de-recursos.md.

export const RECURSOS = Object.freeze({
	// --- Dibujos finales (hojas de sprites de 32 x 48 px por cuadro) ---

	// 3 columnas (quieto, paso 1, paso 2) x 4 filas (abajo, derecha, izquierda, arriba).
	jugador: {
		tipo: 'hoja',
		ruta: 'assets/img/jugador/jugador.png',
		ancho: 32,
		alto: 48,
	},

	// 2 cuadros de caminar, en una fila.
	'enemigo-debil': {
		tipo: 'hoja',
		ruta: 'assets/img/enemigos/enemigo-debil.png',
		ancho: 32,
		alto: 48,
	},

	// 22 piezas de suelo y pared en 8 columnas x 3 filas. Los números de cuadro están en
	// FOTOGRAMAS_TILESET (más abajo).
	tileset: {
		tipo: 'hoja',
		ruta: 'assets/img/escenario/tileset-prision.png',
		ancho: 32,
		alto: 48,
	},

	// --- Dibujos provisionales (generados por código) ---
	caja: {
		tipo: 'generado',
		ancho: 64,
		alto: 64,
		formas: [
			{ x: 0, y: 0, ancho: 64, alto: 64, color: 0x5e4630 },
			{ x: 4, y: 4, ancho: 56, alto: 56, color: 0x7a5a3a },
			{ x: 30, y: 4, ancho: 4, alto: 56, color: 0x5e4630 },
			{ x: 4, y: 30, ancho: 56, alto: 4, color: 0x5e4630 },
		],
	},

	'cofre-cerrado': {
		tipo: 'generado',
		ancho: 32,
		alto: 32,
		formas: [
			{ x: 2, y: 8, ancho: 28, alto: 20, color: 0x7a4f2a }, // caja
			{ x: 2, y: 8, ancho: 28, alto: 8, color: 0x946339 }, // tapa
			{ x: 2, y: 15, ancho: 28, alto: 2, color: 0x4a2f18 }, // unión de la tapa
			{ x: 6, y: 8, ancho: 2, alto: 20, color: 0x4a2f18 }, // refuerzo izquierdo
			{ x: 24, y: 8, ancho: 2, alto: 20, color: 0x4a2f18 }, // refuerzo derecho
			{ x: 14, y: 13, ancho: 4, alto: 6, color: 0xd9b84a }, // cerradura
			{ x: 2, y: 27, ancho: 28, alto: 2, color: 0x3a2412 }, // sombra
		],
	},

	'cofre-abierto': {
		tipo: 'generado',
		ancho: 32,
		alto: 32,
		formas: [
			{ x: 2, y: 14, ancho: 28, alto: 14, color: 0x7a4f2a }, // caja
			{ x: 4, y: 14, ancho: 24, alto: 6, color: 0x2a1a0e }, // interior oscuro
			{ x: 14, y: 15, ancho: 4, alto: 3, color: 0xffe27a }, // brillo adentro
			{ x: 2, y: 4, ancho: 28, alto: 8, color: 0x946339 }, // tapa levantada
			{ x: 2, y: 11, ancho: 28, alto: 2, color: 0x4a2f18 }, // borde de la tapa
			{ x: 2, y: 27, ancho: 28, alto: 2, color: 0x3a2412 }, // sombra
		],
	},

	'corazon-lleno': {
		tipo: 'generado',
		ancho: 16,
		alto: 16,
		formas: [
			{ x: 1, y: 2, ancho: 6, alto: 3, color: 0xc0392b },
			{ x: 9, y: 2, ancho: 6, alto: 3, color: 0xc0392b },
			{ x: 0, y: 4, ancho: 16, alto: 4, color: 0xc0392b },
			{ x: 1, y: 8, ancho: 14, alto: 2, color: 0xc0392b },
			{ x: 3, y: 10, ancho: 10, alto: 2, color: 0xc0392b },
			{ x: 5, y: 12, ancho: 6, alto: 2, color: 0xc0392b },
			{ x: 7, y: 14, ancho: 2, alto: 1, color: 0xc0392b },
			{ x: 3, y: 3, ancho: 2, alto: 2, color: 0xe6736a }, // brillo
		],
	},

	'corazon-vacio': {
		tipo: 'generado',
		ancho: 16,
		alto: 16,
		formas: [
			{ x: 1, y: 2, ancho: 6, alto: 3, color: 0x4a3a38 },
			{ x: 9, y: 2, ancho: 6, alto: 3, color: 0x4a3a38 },
			{ x: 0, y: 4, ancho: 16, alto: 4, color: 0x4a3a38 },
			{ x: 1, y: 8, ancho: 14, alto: 2, color: 0x4a3a38 },
			{ x: 3, y: 10, ancho: 10, alto: 2, color: 0x4a3a38 },
			{ x: 5, y: 12, ancho: 6, alto: 2, color: 0x4a3a38 },
			{ x: 7, y: 14, ancho: 2, alto: 1, color: 0x4a3a38 },
		],
	},

	bala: {
		tipo: 'generado',
		ancho: 8,
		alto: 8,
		formas: [
			{ x: 2, y: 0, ancho: 4, alto: 8, color: 0xd9b84a },
			{ x: 0, y: 2, ancho: 8, alto: 4, color: 0xd9b84a },
			{ x: 2, y: 2, ancho: 4, alto: 4, color: 0xfff1b8 },
		],
	},
});

// Número de cada cuadro de la hoja `tileset` (cuenta de izquierda a derecha y de arriba abajo,
// empezando en 0). Es el número del archivo de arte/originales/escenario menos 1.
// Los nombres describen lo que se ve en cada pieza; son provisionales hasta confirmar con quien
// las dibujó para qué sirve cada una.
export const FOTOGRAMAS_TILESET = Object.freeze({
	marcoEsquinaArribaIzquierda: 0,
	marcoEsquinaArribaDerecha: 1,
	marcoEsquinaAbajoDerecha: 2,
	marcoEsquinaAbajoIzquierda: 3,
	marcoBordeArriba: 4,
	marcoBordeAbajo: 5,
	marcoBordeIzquierda: 6,
	marcoBordeDerecha: 7,
	texturaRayasMarron: 8,
	texturaRanuras: 9,
	panelMarco: 10,
	panelConcentrico: 11,
	sueloBordeAbajoDerecha: 12,
	sueloBordeAbajoIzquierda: 13,
	sueloBordeArribaIzquierda: 14,
	sueloBordeArribaDerecha: 15,
	sueloBordeArriba: 16,
	sueloBordeAbajo: 17,
	sueloBordeIzquierda: 18,
	sueloBordeDerecha: 19,
	sueloLiso: 20,
	sueloRayas: 21,
});
