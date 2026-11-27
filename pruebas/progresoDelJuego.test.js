import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { cartelDe } from '../src/datos/carteles.js';
import { NIVELES } from '../src/datos/niveles.js';
import { alDerrotarAlJefe, alMorir, NIVEL_INICIAL } from '../src/sistemas/ProgresoDelJuego.js';

// Cómo avanza y termina la partida (27/11/2026): morir manda al nivel 1, el jefe 1 lleva al nivel 2 y el jefe del último
// nivel gana el juego. Los carteles dicen lo que pidió el usuario.
const TOTAL = Object.keys(NIVELES).length;

test('el juego tiene 2 niveles: no hay nivel 3', () => {
	assert.equal(TOTAL, 2);
	assert.equal(NIVEL_INICIAL, 1);
});

test('al morir se vuelve a empezar desde el nivel 1, y el desenlace es una derrota', () => {
	assert.deepEqual(alMorir(), { tipo: 'derrota', siguiente: 1 });
});

test('al derrotar al jefe del nivel 1 se pasa al nivel 2', () => {
	assert.deepEqual(alDerrotarAlJefe(1, TOTAL), { tipo: 'nivel-completado', siguiente: 2 });
});

test('al derrotar al jefe del nivel 2 (el último) se gana el juego, y jugar de nuevo empieza en el nivel 1', () => {
	assert.deepEqual(alDerrotarAlJefe(2, TOTAL), { tipo: 'victoria', siguiente: 1 });
});

test('con otro número de niveles las reglas se adaptan: solo gana quien derrota al jefe del último', () => {
	assert.equal(alDerrotarAlJefe(1, 3).tipo, 'nivel-completado');
	assert.equal(alDerrotarAlJefe(2, 3).tipo, 'nivel-completado');
	assert.deepEqual(alDerrotarAlJefe(3, 3), { tipo: 'victoria', siguiente: 1 });
	assert.deepEqual(
		alDerrotarAlJefe(1, 1),
		{ tipo: 'victoria', siguiente: 1 },
		'un juego de un solo nivel',
	);
});

test('el nivel al que se llega siempre existe en el juego', () => {
	for (const nivel of [1, 2]) {
		const { siguiente } = alDerrotarAlJefe(nivel, TOTAL);
		assert.ok(NIVELES[siguiente], `no existe el nivel ${siguiente}`);
	}
	assert.ok(NIVELES[alMorir().siguiente]);
});

test('el cartel de perder dice «Perdiste» y «¿Deseas volver a intentarlo?», con un botón', () => {
	const cartel = cartelDe(alMorir());
	assert.equal(cartel.titulo, 'Perdiste');
	assert.equal(cartel.subtitulo, '¿Deseas volver a intentarlo?');
	assert.match(cartel.boton, /Volver a intentar/);
});

test('el cartel de ganar dice «¡Ganaste!» y «Cada día estás más cerca de ser bilingüe»', () => {
	const cartel = cartelDe(alDerrotarAlJefe(2, TOTAL));
	assert.equal(cartel.titulo, '¡Ganaste!');
	assert.equal(cartel.subtitulo, 'Cada día estás más cerca de ser bilingüe');
	assert.ok(cartel.boton.length > 0);
});

test('el cartel de nivel completado nombra el nivel que viene', () => {
	const cartel = cartelDe(alDerrotarAlJefe(1, TOTAL));
	assert.equal(cartel.titulo, '¡Nivel completado!');
	assert.match(cartel.subtitulo, /nivel 2/);
});

test('los tres carteles son distintos y tienen todo: título, subtítulo, botón y un color válido', () => {
	const carteles = [
		cartelDe(alMorir()),
		cartelDe(alDerrotarAlJefe(1, TOTAL)),
		cartelDe(alDerrotarAlJefe(2, TOTAL)),
	];
	assert.equal(new Set(carteles.map((c) => c.titulo)).size, 3);
	assert.equal(
		new Set(carteles.map((c) => c.color)).size,
		3,
		'perder, pasar y ganar tienen colores distintos',
	);
	for (const { titulo, subtitulo, boton, color } of carteles) {
		for (const texto of [titulo, subtitulo, boton]) {
			assert.ok(typeof texto === 'string' && texto.length > 0);
		}
		assert.ok(Number.isInteger(color) && color >= 0 && color <= 0xffffff);
	}
});

test('un desenlace que no existe da un error que lo dice (no un cartel vacío)', () => {
	assert.throws(() => cartelDe({ tipo: 'empate', siguiente: 1 }), /No hay cartel para «empate»/);
});

test('los textos caben en el cartel (600 px de ancho, letra monoespaciada): el subtítulo, en dos líneas como mucho', () => {
	const caracteresPorLinea = Math.floor((CONFIG.CARTEL.ANCHO - 60) / 13.2); // 22 px de letra ≈ 13,2 px por carácter
	for (const desenlace of [alMorir(), alDerrotarAlJefe(1, TOTAL), alDerrotarAlJefe(2, TOTAL)]) {
		const { subtitulo, boton } = cartelDe(desenlace);
		assert.ok(
			subtitulo.length <= 2 * caracteresPorLinea,
			`${subtitulo.length} caracteres: ${subtitulo}`,
		);
		// El botón mide 440 px y su letra de 24 px ocupa ~14,4 px por carácter.
		assert.ok(
			boton.length * 14.4 <= CONFIG.CARTEL.BOTON_ANCHO - 20,
			`«${boton}» no cabe en el botón`,
		);
	}
});

test('el botón no responde al instante: espera un momento para no aceptarse sin querer, pero no demasiado', () => {
	const { RETRASO_PARA_ACEPTAR, RETRASO_TRAS_MORIR, RETRASO_TRAS_EL_JEFE } = CONFIG.CARTEL;
	assert.ok(
		RETRASO_PARA_ACEPTAR >= 400 && RETRASO_PARA_ACEPTAR <= 1500,
		`${RETRASO_PARA_ACEPTAR} ms`,
	);
	assert.ok(RETRASO_TRAS_MORIR >= 500 && RETRASO_TRAS_MORIR <= 2000);
	assert.ok(
		RETRASO_TRAS_EL_JEFE >= 1000,
		'el jefe tarda ~0,9 s en desvanecerse: el cartel sale después',
	);
});
