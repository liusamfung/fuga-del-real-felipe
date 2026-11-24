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
