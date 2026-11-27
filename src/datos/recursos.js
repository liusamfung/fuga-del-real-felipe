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

// Un generador de números «al azar» que siempre da la misma serie (la semilla), para que el dibujo
// provisional del rayo salga igual en cada partida y en las pruebas.
function azarConSemilla(semilla) {
	let estado = semilla;
	return () => {
		estado = (estado + 0x6d2b79f5) | 0;
		let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// El rayo verde del ataque fuerte del jefe (provisional): una franja de energía que se repite a lo largo del rayo
// (por eso el borde izquierdo y el derecho encajan: nada cambia de forma gradual a lo ancho). Capas de verde, de
// oscuro en el borde a casi blanco en el centro, con el borde irregular, chispas sueltas y rayitas claras. Está
// dibujada con la misma paleta que el fantasma y su proyectil.
function franjaDelRayo(ancho, alto) {
	const azar = azarConSemilla(27112026);
	const centro = alto / 2;
	const capas = [
		{ color: 0x2f7a3a, mitad: 7 }, // borde
		{ color: 0x4fd16a, mitad: 4 },
		{ color: 0xa6f5a0, mitad: 2 },
		{ color: 0xe8ffd9, mitad: 1 }, // centro
	];
	const formas = [];

	for (let x = 0; x < ancho; x += 1) {
		const irregular = Math.floor(azar() * 3) - 1; // -1, 0 o +1 px en esta columna
		for (const { color, mitad } of capas) {
			const m = mitad + (mitad > 1 ? irregular : 0);
			formas.push({ x, y: centro - m, ancho: 1, alto: 2 * m, color });
		}
		if (azar() < 0.3) {
			// una chispa suelta fuera del borde
			const lado = azar() < 0.5 ? -1 : 1;
			formas.push({
				x,
				y: centro + lado * (9 + Math.floor(azar() * 2)),
				ancho: 1,
				alto: 1,
				color: 0x4fd16a,
			});
		}
	}

	// Rayitas claras a lo largo, para que al desplazar la franja se vea que la energía corre.
	for (let i = 0; i < 6; i += 1) {
		const largo = 5 + Math.floor(azar() * 5);
		const x = Math.floor(azar() * (ancho - largo));
		const y = centro + Math.floor(azar() * 7) - 3;
		formas.push({ x, y, ancho: largo, alto: 1, color: 0xffffff });
	}

	return { tipo: 'generado', ancho, alto, formas };
}

// La bola de energía de donde sale el rayo (provisional): círculos de verde, del borde oscuro al centro casi
// blanco, con el borde algo irregular. Se dibuja por filas de un mismo color.
function bolaDeEnergia(lado) {
	const azar = azarConSemilla(15101985);
	const anillos = [
		{ hasta: 0.3, color: 0xf4fff0 },
		{ hasta: 0.55, color: 0xa6f5a0 },
		{ hasta: 0.8, color: 0x4fd16a },
		{ hasta: 1, color: 0x2f7a3a },
	];
	const centro = (lado - 1) / 2;
	const formas = [];

	for (let y = 0; y < lado; y += 1) {
		let anterior = null;
		for (let x = 0; x < lado; x += 1) {
			const radio = Math.hypot(x - centro, y - centro) / (lado / 2) + (azar() - 0.5) * 0.12;
			const anillo = anillos.find(({ hasta }) => radio <= hasta);
			const color = anillo?.color ?? null;
			if (anterior && anterior.color === color && color !== null) {
				anterior.ancho += 1; // sigue la misma franja de color
			} else {
				anterior = color === null ? null : { x, y, ancho: 1, alto: 1, color };
				if (anterior) {
					formas.push(anterior);
				}
			}
		}
	}

	return { tipo: 'generado', ancho: lado, alto: lado, formas };
}

// Dibujo provisional de una puerta de reja. Una puerta horizontal (arriba o abajo de la sala) tiene
// barras verticales; una vertical (a los lados), barras horizontales. Con cerradura es la puerta
// que se abre con la llave.
function puertaDeRejas(ancho, alto, conCerradura) {
	const horizontal = ancho > alto;
	const formas = [{ x: 0, y: 0, ancho, alto, color: 0x1d1d21 }];

	for (let i = 0; i < 5; i += 1) {
		const posicion = 8 + i * 18;
		formas.push(
			horizontal
				? { x: posicion, y: 3, ancho: 8, alto: 26, color: 0x6b6e75 }
				: { x: 3, y: posicion, ancho: 26, alto: 8, color: 0x6b6e75 },
		);
	}

	if (conCerradura) {
		const x = horizontal ? 40 : 8;
		const y = horizontal ? 8 : 40;
		formas.push(
			{ x, y, ancho: 16, alto: 16, color: 0xd9b84a }, // placa dorada
			{ x: x + 6, y: y + 5, ancho: 4, alto: 6, color: 0x5a4310 }, // agujero de la llave
		);
	}

	return { tipo: 'generado', ancho, alto, formas };
}

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

	// Las 4 ratas (dibujos de Jorge): cada una, 2 cuadros de caminar en una fila, como el enemigo débil.
	'rata-azul': { tipo: 'hoja', ruta: 'assets/img/enemigos/rata-azul.png', ancho: 32, alto: 48 },
	'rata-gris': { tipo: 'hoja', ruta: 'assets/img/enemigos/rata-gris.png', ancho: 32, alto: 48 },
	'rata-blanca': { tipo: 'hoja', ruta: 'assets/img/enemigos/rata-blanca.png', ancho: 32, alto: 48 },
	'rata-negra': { tipo: 'hoja', ruta: 'assets/img/enemigos/rata-negra.png', ancho: 32, alto: 48 },

	// Los guardias del nivel 2 (dibujos de Jorge): 3 cuadros de caminar cada uno (de pie y dos pasos).
	'guardia-azul': {
		tipo: 'hoja',
		ruta: 'assets/img/enemigos/guardia-azul.png',
		ancho: 32,
		alto: 48,
	},
	'guardia-rojo': {
		tipo: 'hoja',
		ruta: 'assets/img/enemigos/guardia-rojo.png',
		ancho: 32,
		alto: 48,
	},

	// El segundo jefe: un fantasma con corona. 3 cuadros de flotar en una fila (las manos y la barba
	// cambian de posición). Ojo: los cuadros miden 32 x 32, no 32 x 48 como los de los demás personajes.
	'jefe-2': {
		tipo: 'hoja',
		ruta: 'assets/img/enemigos/jefe-2.png',
		ancho: 32,
		alto: 32,
	},

	// 22 piezas de suelo y pared en 8 columnas x 3 filas. Los números de cuadro están en
	// FOTOGRAMAS_TILESET (más abajo).
	tileset: {
		tipo: 'hoja',
		ruta: 'assets/img/escenario/tileset-prision.png',
		ancho: 32,
		alto: 48,
	},

	// El tileset del nivel 2 (de Jorge): la misma distribución que el del nivel 1, repintada en azul y violeta,
	// pero con 13 piezas (ver `FOTOGRAMAS_TILESET_2`). No trae las piezas de suelo con bordes.
	'tileset-2': {
		tipo: 'hoja',
		ruta: 'assets/img/escenario/tileset-prision-2.png',
		ancho: 32,
		alto: 48,
	},

	// --- Dibujos provisionales (generados por código) ---
	'puerta-h': puertaDeRejas(96, 32, false),
	'puerta-v': puertaDeRejas(32, 96, false),
	'puerta-llave-h': puertaDeRejas(96, 32, true),
	'puerta-llave-v': puertaDeRejas(32, 96, true),

	llave: {
		tipo: 'generado',
		ancho: 16,
		alto: 16,
		formas: [
			{ x: 1, y: 3, ancho: 7, alto: 7, color: 0xd9b84a }, // argolla
			{ x: 3, y: 5, ancho: 3, alto: 3, color: 0x1a1612 }, // hueco de la argolla
			{ x: 8, y: 5, ancho: 7, alto: 3, color: 0xd9b84a }, // caña
			{ x: 11, y: 8, ancho: 2, alto: 3, color: 0xd9b84a }, // dientes
			{ x: 14, y: 8, ancho: 2, alto: 2, color: 0xd9b84a },
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

	// El nido de ratas (provisional): un montón de paja y barro con agujeros oscuros y ojos rojos. Mide lo
	// mismo que una caja (64×64), pero no se confunde con ella.
	nido: {
		tipo: 'generado',
		ancho: 64,
		alto: 64,
		formas: [
			{ x: 0, y: 10, ancho: 64, alto: 54, color: 0x3b2a22 }, // base de barro
			{ x: 6, y: 16, ancho: 52, alto: 44, color: 0x55392c },
			{ x: 4, y: 2, ancho: 14, alto: 14, color: 0x9c7a43 }, // paja
			{ x: 26, y: 0, ancho: 14, alto: 12, color: 0xb08a4a },
			{ x: 46, y: 4, ancho: 14, alto: 12, color: 0x9c7a43 },
			{ x: 20, y: 28, ancho: 24, alto: 22, color: 0x120d0b }, // la boca del nido
			{ x: 8, y: 46, ancho: 10, alto: 8, color: 0x120d0b },
			{ x: 46, y: 22, ancho: 10, alto: 8, color: 0x120d0b },
			{ x: 25, y: 36, ancho: 4, alto: 4, color: 0xc0392b }, // ojos
			{ x: 35, y: 36, ancho: 4, alto: 4, color: 0xc0392b },
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

	// El proyectil del jefe (provisional): una bola verdosa con un centro claro, como el fantasma.
	'proyectil-jefe': {
		tipo: 'generado',
		ancho: 12,
		alto: 12,
		formas: [
			{ x: 3, y: 0, ancho: 6, alto: 12, color: 0x6fae5c },
			{ x: 0, y: 3, ancho: 12, alto: 6, color: 0x6fae5c },
			{ x: 2, y: 2, ancho: 8, alto: 8, color: 0x9ed38a },
			{ x: 4, y: 4, ancho: 4, alto: 4, color: 0xe8ffd9 },
		],
	},

	// El rayo del ataque fuerte del jefe (provisional): la franja se repite a lo largo del rayo y la bola es de donde sale.
	'rayo-jefe': franjaDelRayo(64, 24),
	'rayo-cabeza': bolaDeEnergia(32),

	// Las balas de los guardias (provisionales): una pequeña de cada color, para que se distinga quién disparó.
	'bala-guardia-azul': {
		tipo: 'generado',
		ancho: 10,
		alto: 10,
		formas: [
			{ x: 3, y: 0, ancho: 4, alto: 10, color: 0x4a74d9 },
			{ x: 0, y: 3, ancho: 10, alto: 4, color: 0x4a74d9 },
			{ x: 2, y: 2, ancho: 6, alto: 6, color: 0x8fb4ff },
			{ x: 4, y: 4, ancho: 2, alto: 2, color: 0xe8f0ff },
		],
	},
	'bala-guardia-roja': {
		tipo: 'generado',
		ancho: 10,
		alto: 10,
		formas: [
			{ x: 3, y: 0, ancho: 4, alto: 10, color: 0xc0392b },
			{ x: 0, y: 3, ancho: 10, alto: 4, color: 0xc0392b },
			{ x: 2, y: 2, ancho: 6, alto: 6, color: 0xff7a5c },
			{ x: 4, y: 4, ancho: 2, alto: 2, color: 0xffe3d6 },
		],
	},

	// La granada del jugador (poder especial): una bola oscura con la mecha encendida.
	granada: {
		tipo: 'generado',
		ancho: 12,
		alto: 12,
		formas: [
			{ x: 5, y: 0, ancho: 2, alto: 3, color: 0xff9a3c }, // mecha
			{ x: 3, y: 3, ancho: 6, alto: 8, color: 0x3a3d45 }, // cuerpo
			{ x: 1, y: 5, ancho: 10, alto: 4, color: 0x3a3d45 },
			{ x: 3, y: 5, ancho: 2, alto: 2, color: 0x7d818c }, // brillo
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

// Lo mismo para el tileset del nivel 2 (`tileset-2`): son 13 piezas, en el mismo orden que las primeras del otro
// (los marcos y los paneles), y la 12 es el suelo. No tiene las piezas de suelo con borde (13 a 21 del otro).
export const FOTOGRAMAS_TILESET_2 = Object.freeze({
	marcoEsquinaArribaIzquierda: 0,
	marcoEsquinaArribaDerecha: 1,
	marcoEsquinaAbajoDerecha: 2,
	marcoEsquinaAbajoIzquierda: 3,
	marcoBordeArriba: 4,
	marcoBordeAbajo: 5,
	marcoBordeIzquierda: 6,
	marcoBordeDerecha: 7,
	paredLisa: 8,
	ranuras: 9,
	panelMarco: 10,
	panelConcentrico: 11,
	sueloPunteado: 12,
});
