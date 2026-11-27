// Los tipos de enemigo del juego: cada uno tiene su dibujo, su animación y lo que lo hace distinto
// (cuánta vida tiene, qué tan rápido es y cuánto daño hace). Los valores son iniciales: se ajustan jugando.
//
//   textura     la hoja de sprites (src/datos/recursos.js): 2 cuadros de caminar las ratas, 3 los guardias
//   animacion   la animación de caminar (src/datos/animaciones.js)
//   vida        cuántas balas aguanta (cada bala quita el ataque del jugador, que empieza en 1)
//   velocidad   px/s con los que persigue al jugador (el jugador camina a 220)
//   dano        cuánta vida le quita al jugador al tocarlo (el jugador empieza con 3)
//   letal       (opcional) si es `true`, mata al jugador de un solo toque, tenga las vidas que tenga; en ese
//               caso no lleva `dano`
//
//   sonidoDeAtaque  (opcional) el efecto (src/datos/audio.js) que suena cuando toca al jugador; hoy lo tienen las ratas
//   disparo     (opcional) los que lo tienen DISPARAN en vez de embestir: se mantienen a cierta distancia del
//               jugador (ver `Tirador`, src/sistemas/Tirador.js) y lanzan balas. Sus campos:
//                 patron           'simple' (una bala hacia el jugador) o 'abanico' (`cantidad` balas abiertas
//                                  `apertura` grados una de otra, la del medio hacia el jugador)
//                 sonido           el efecto (src/datos/audio.js) que suena en cada disparo
//                 textura, velocidad, dano   la bala (su dibujo, px/s y corazones que quita)
//                 intervalo        ms entre un disparo y el siguiente
//                 aviso            ms que se queda quieto apuntando antes de disparar (el jugador lo ve venir)
//                 alcance          distancia (px) a la que empieza a apuntar
//                 distanciaMinima, distanciaMaxima   la franja que mantiene: más cerca se aleja, más lejos se acerca
//                 primerDisparo, variacion   ms hasta el primer disparo y cuánto se le suma al azar (que no
//                                  disparen todos a la vez)
//
// Las ratas hacen todas lo mismo (caminar en línea recta hacia el jugador): lo que las distingue es lo de arriba y
// CUÁNTAS hay en cada sala (src/datos/niveles.js). Los guardias (nivel 2) se distinguen por CÓMO disparan. Los
// dibujos de las ratas y de los guardias son de Jorge.

// El nivel 2: los guardias de la prisión. Los dos tienen arma pero la usan distinto.
//
// Guardia azul: el TIRADOR. Mantiene la distancia (se aleja si te acercas) y dispara una bala rápida y certera,
// seguido. Hay que moverse sin parar y acercársele rodeando las cajas.
const GUARDIA_AZUL = Object.freeze({
	textura: 'guardia-azul',
	animacion: 'guardia-azul-caminar',
	vida: 3,
	velocidad: 60,
	dano: 1,
	disparo: Object.freeze({
		patron: 'simple',
		sonido: 'guardia-rifle-disparo',
		textura: 'bala-guardia-azul',
		velocidad: 300,
		dano: 1,
		intervalo: 1700,
		aviso: 300,
		alcance: 480,
		distanciaMinima: 200,
		distanciaMaxima: 300,
		primerDisparo: 900,
		variacion: 800,
	}),
});

// Guardia rojo: el ESCOPETERO. Avanza despacio hasta quedar cerca, se detiene un buen rato apuntando (el aviso es
// largo) y suelta un abanico de tres balas lentas. Aguanta más. Hay que esquivar de lado cuando se detiene.
const GUARDIA_ROJO = Object.freeze({
	textura: 'guardia-rojo',
	animacion: 'guardia-rojo-caminar',
	vida: 5,
	velocidad: 45,
	dano: 1,
	disparo: Object.freeze({
		patron: 'abanico',
		sonido: 'guardia-escopeta-disparo',
		cantidad: 3,
		apertura: 26,
		textura: 'bala-guardia-roja',
		velocidad: 230,
		dano: 1,
		intervalo: 2600,
		aviso: 550,
		alcance: 340,
		distanciaMinima: 90,
		distanciaMaxima: 200,
		primerDisparo: 1400,
		variacion: 900,
	}),
});

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
		sonidoDeAtaque: 'rata-ataque',
		vida: 1,
		velocidad: 70,
		dano: 2,
	}),

	// La veloz: más del doble de rápida que las demás y cae con dos balas. Hay que apuntar rápido.
	'rata-blanca': Object.freeze({
		textura: 'rata-blanca',
		animacion: 'rata-blanca-caminar',
		sonidoDeAtaque: 'rata-ataque',
		vida: 2,
		velocidad: 160,
		dano: 1,
	}),

	// La acorazada: lenta, pero aguanta cinco balas. Se esquiva fácil y estorba mucho.
	'rata-azul': Object.freeze({
		textura: 'rata-azul',
		animacion: 'rata-azul-caminar',
		sonidoDeAtaque: 'rata-ataque',
		vida: 5,
		velocidad: 45,
		dano: 1,
	}),

	// La cazadora: aguanta diez balas, es bastante rápida y **mata de un solo toque**. Hay que mantenerla
	// lejos (el dash da inmunidad un instante) y nunca dejar que se acerque. Hay pocas.
	'rata-negra': Object.freeze({
		textura: 'rata-negra',
		animacion: 'rata-negra-caminar',
		sonidoDeAtaque: 'rata-ataque',
		vida: 10,
		velocidad: 100,
		letal: true,
	}),

	// Los guardias del nivel 2 (ver arriba).
	'guardia-azul': GUARDIA_AZUL,
	'guardia-rojo': GUARDIA_ROJO,
});

export const NOMBRES_DE_TIPOS = Object.freeze(Object.keys(TIPOS_DE_ENEMIGO));
