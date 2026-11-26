// Los tipos de enemigo del juego: cada uno tiene su dibujo, su animación y lo que lo hace distinto
// (cuánta vida tiene, qué tan rápido es y cuánto daño hace). Los valores son iniciales: se ajustan jugando.
//
//   textura     la hoja de sprites (src/datos/recursos.js); cada una tiene 2 cuadros de caminar
//   animacion   la animación de caminar (src/datos/animaciones.js)
//   vida        cuántas balas aguanta (cada bala quita el ataque del jugador, que empieza en 1)
//   velocidad   px/s con los que persigue al jugador (el jugador camina a 220)
//   dano        cuánta vida le quita al jugador al tocarlo (el jugador empieza con 3)
//   letal       (opcional) si es `true`, mata al jugador de un solo toque, tenga las vidas que tenga; en ese
//               caso no lleva `dano`
//
// Todos hacen lo mismo (caminar en línea recta hacia el jugador): lo que los distingue es esto y CUÁNTOS hay
// en cada sala (src/datos/niveles.js). Los dibujos de las ratas son de Jorge.

export const TIPOS_DE_ENEMIGO = Object.freeze({
	// El enemigo de siempre: equilibrado. Se usa poco, como una variante más.
	debil: Object.freeze({
		textura: 'enemigo-debil',
		animacion: 'enemigo-debil-caminar',
		vida: 3,
		velocidad: 70,
		dano: 1,
	}),

	// La plaga: frágil y de velocidad normal, pero viene en manada (hasta 6 en una sala, y el nido de cada
	// sala suelta más). Una bala basta, pero cada mordida quita 2 corazones.
	'rata-gris': Object.freeze({
		textura: 'rata-gris',
		animacion: 'rata-gris-caminar',
		vida: 1,
		velocidad: 70,
		dano: 2,
	}),

	// La veloz: más del doble de rápida que las demás y cae con dos balas. Hay que apuntar rápido.
	'rata-blanca': Object.freeze({
		textura: 'rata-blanca',
		animacion: 'rata-blanca-caminar',
		vida: 2,
		velocidad: 160,
		dano: 1,
	}),

	// La acorazada: lenta, pero aguanta cinco balas. Se esquiva fácil y estorba mucho.
	'rata-azul': Object.freeze({
		textura: 'rata-azul',
		animacion: 'rata-azul-caminar',
		vida: 5,
		velocidad: 45,
		dano: 1,
	}),

	// La cazadora: aguanta diez balas, es bastante rápida y **mata de un solo toque**. Hay que mantenerla
	// lejos (el dash da inmunidad un instante) y nunca dejar que se acerque. Hay pocas.
	'rata-negra': Object.freeze({
		textura: 'rata-negra',
		animacion: 'rata-negra-caminar',
		vida: 10,
		velocidad: 100,
		letal: true,
	}),
});

export const NOMBRES_DE_TIPOS = Object.freeze(Object.keys(TIPOS_DE_ENEMIGO));
