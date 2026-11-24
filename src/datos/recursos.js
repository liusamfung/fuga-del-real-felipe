// Catálogo de recursos: la clave de cada imagen y de dónde sale.
//
// Mientras no existan los sprites finales, cada recurso es "generado": se dibuja por código con
// rectángulos de colores. Cuando llegue el PNG definitivo, solo se cambia la entrada:
//
//   jugador: { tipo: 'imagen', ruta: 'assets/img/jugador.png' },
//
// y el resto del juego sigue funcionando igual (usa siempre la clave).
// Los colores de cada forma son 0xRRGGBB.

export const RECURSOS = Object.freeze({
	suelo: {
		tipo: 'generado',
		ancho: 32,
		alto: 32,
		formas: [
			{ x: 0, y: 0, ancho: 32, alto: 32, color: 0x4b4239 },
			{ x: 0, y: 0, ancho: 32, alto: 1, color: 0x3f372f },
			{ x: 0, y: 0, ancho: 1, alto: 32, color: 0x3f372f },
		],
	},

	pared: {
		tipo: 'generado',
		ancho: 32,
		alto: 32,
		formas: [
			{ x: 0, y: 0, ancho: 32, alto: 32, color: 0x2d2824 },
			{ x: 0, y: 0, ancho: 32, alto: 3, color: 0x4a423a },
			{ x: 0, y: 29, ancho: 32, alto: 3, color: 0x1d1a17 },
		],
	},

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

	'enemigo-debil': {
		tipo: 'generado',
		ancho: 32,
		alto: 32,
		formas: [
			{ x: 4, y: 6, ancho: 24, alto: 22, color: 0x5f7a4a }, // cuerpo
			{ x: 4, y: 24, ancho: 24, alto: 6, color: 0x46593a }, // sombra de abajo
			{ x: 8, y: 12, ancho: 5, alto: 5, color: 0xe8d9a0 }, // ojo izquierdo
			{ x: 19, y: 12, ancho: 5, alto: 5, color: 0xe8d9a0 }, // ojo derecho
			{ x: 10, y: 13, ancho: 2, alto: 3, color: 0x8a2b2b }, // pupila izquierda
			{ x: 21, y: 13, ancho: 2, alto: 3, color: 0x8a2b2b }, // pupila derecha
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

	jugador: {
		tipo: 'generado',
		ancho: 32,
		alto: 48,
		formas: [
			{ x: 8, y: 0, ancho: 16, alto: 14, color: 0xd4bfa0 }, // cabeza
			{ x: 4, y: 14, ancho: 24, alto: 24, color: 0x2a3f8f }, // cuerpo
			{ x: 8, y: 38, ancho: 6, alto: 10, color: 0x1c2a63 }, // pierna izquierda
			{ x: 18, y: 38, ancho: 6, alto: 10, color: 0x1c2a63 }, // pierna derecha
		],
	},
});
