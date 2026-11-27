import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { ANIMACIONES } from '../src/datos/animaciones.js';
import { NIVELES } from '../src/datos/niveles.js';
import { RECURSOS } from '../src/datos/recursos.js';
import { PeleaConElJefe } from '../src/sistemas/PeleaConElJefe.js';

// Cada nivel tiene su propio jefe (`CONFIG.JEFES[nivel]`). El del nivel 2 empezó como un duplicado del del nivel 1
// (27/11/2026): el fantasma, que se puso en el nivel 1 solo para probar y en realidad es el jefe del nivel 2. Es un
// objeto aparte para poder retocarlo sin tocar al otro.
const { JEFES } = CONFIG;

test('hay un jefe por cada nivel del juego, y el del nivel 1 sigue siendo CONFIG.JEFE', () => {
	assert.deepEqual(Object.keys(JEFES), Object.keys(NIVELES));
	assert.equal(JEFES[1], CONFIG.JEFE);
});

test('el jefe del nivel 2 es un objeto aparte del del nivel 1, y los dos están congelados', () => {
	assert.notEqual(JEFES[2], JEFES[1], 'el mismo objeto: retocar uno cambiaría al otro');
	assert.ok(Object.isFrozen(JEFES[1]) && Object.isFrozen(JEFES[2]));
});

test('el jefe del nivel 2 está completo: tiene todos los campos del del nivel 1', () => {
	assert.deepEqual(Object.keys(JEFES[2]).sort(), Object.keys(JEFES[1]).sort());
	for (const bloque of ['PROYECTIL', 'RAYO', 'TRIPLE', 'RAFAGA']) {
		assert.deepEqual(
			Object.keys(JEFES[2][bloque]).sort(),
			Object.keys(JEFES[1][bloque]).sort(),
			bloque,
		);
	}
});

test('cada jefe tiene su dibujo y su animación, y con su configuración se arma una pelea que empieza', () => {
	for (const [nivel, jefe] of Object.entries(JEFES)) {
		assert.equal(
			RECURSOS[jefe.CLAVE]?.tipo,
			'hoja',
			`nivel ${nivel}: no existe la hoja «${jefe.CLAVE}»`,
		);
		assert.ok(
			ANIMACIONES.some(({ clave }) => clave === `${jefe.CLAVE}-flotar`),
			`nivel ${nivel}: falta la animación ${jefe.CLAVE}-flotar`,
		);
		assert.ok(Number.isInteger(jefe.ESCALA) && jefe.ESCALA >= 1, `nivel ${nivel}: escala entera`);

		const pelea = new PeleaConElJefe({
			vidaMaxima: jefe.VIDA,
			umbrales: jefe.UMBRALES,
			intervaloDeAtaque: jefe.INTERVALO_DE_ATAQUE,
			primerAtaque: jefe.PRIMER_ATAQUE,
			nivelesDeInglesDeLosAtaquesFuertes: jefe.NIVELES_DE_INGLES,
			devolucion: jefe.DEVOLUCION,
			rapido: jefe.RAPIDO,
			pausaTrasElAtaqueFuerte: jefe.PAUSA_TRAS_EL_ATAQUE_FUERTE,
		});
		pelea.empezar(0);
		assert.equal(pelea.vida, jefe.VIDA, `nivel ${nivel}`);
		assert.ok(jefe.VIDA > 0 && jefe.UMBRALES.length >= 1, `nivel ${nivel}`);
	}
});

test('el dash alcanza para salir del rayo de cada jefe (lo que se exige al del nivel 1 se exige a todos)', () => {
	const recorrido = (CONFIG.DASH.VELOCIDAD * CONFIG.DASH.DURACION) / 1000;
	const mitadDelCuerpo = Math.hypot(CONFIG.JUGADOR.CUERPO_ANCHO, CONFIG.JUGADOR.CUERPO_ALTO) / 2;
	for (const [nivel, jefe] of Object.entries(JEFES)) {
		assert.ok(
			recorrido > jefe.RAYO.ANCHO / 2 + mitadDelCuerpo,
			`nivel ${nivel}: el rayo es muy ancho`,
		);
	}
});

// --- Qué retos usa cada jefe (27/11/2026): el jefe 1 solo los fáciles; el jefe 2 alterna medio y alto ---
const FACIL = 1; // se ve una palabra en español y se dice su traducción en inglés
const MEDIO = 2; // se ve la definición en inglés y se dice la palabra
const ALTO = 3; // el juego dice la palabra en inglés y se escribe con el teclado (dictado)

test('el jefe 1 solo usa retos FÁCILES en todos sus ataques fuertes', () => {
	assert.ok(JEFES[1].NIVELES_DE_INGLES.length >= 1);
	for (const nivel of JEFES[1].NIVELES_DE_INGLES) {
		assert.equal(nivel, FACIL);
	}
});

test('el jefe 2 alterna el reto MEDIO y el ALTO (medio, alto, medio) y nunca usa el fácil', () => {
	assert.deepEqual([...JEFES[2].NIVELES_DE_INGLES], [MEDIO, ALTO, MEDIO]);
	assert.ok(
		JEFES[2].NIVELES_DE_INGLES.includes(MEDIO) && JEFES[2].NIVELES_DE_INGLES.includes(ALTO),
	);
	assert.ok(!JEFES[2].NIVELES_DE_INGLES.includes(FACIL));
});

test('el reto ALTO (el dictado) es solo del jefe 2: el jefe 1 nunca lo usa', () => {
	assert.ok(!JEFES[1].NIVELES_DE_INGLES.includes(ALTO));
	assert.ok(JEFES[2].NIVELES_DE_INGLES.includes(ALTO));
});

test('cada jefe tiene un ataque fuerte por cada umbral de vida, así que ninguno se queda sin reto', () => {
	for (const [nivel, jefe] of Object.entries(JEFES)) {
		assert.ok(
			jefe.NIVELES_DE_INGLES.length >= jefe.UMBRALES.length,
			`nivel ${nivel}: ${jefe.UMBRALES.length} ataques fuertes y ${jefe.NIVELES_DE_INGLES.length} retos`,
		);
	}
});

test('cada jefe tiene su PROPIO dibujo: el del nivel 1 ya no es el fantasma', () => {
	assert.equal(JEFES[1].CLAVE, 'jefe-1');
	assert.equal(JEFES[2].CLAVE, 'jefe-2');
	assert.notEqual(JEFES[1].CLAVE, JEFES[2].CLAVE);
	assert.notEqual(
		RECURSOS[JEFES[1].CLAVE].ruta,
		RECURSOS[JEFES[2].CLAVE].ruta,
		'comparten el mismo archivo',
	);
});

test('lo que depende del dibujo (clave, escala y cuerpo) está en cada jefe, para cambiarlo sin tocar al otro', () => {
	for (const [nivel, jefe] of Object.entries(JEFES)) {
		for (const campo of ['CLAVE', 'ESCALA', 'CUERPO_ANCHO', 'CUERPO_ALTO']) {
			assert.ok(Object.hasOwn(jefe, campo), `nivel ${nivel}: falta ${campo}`);
		}
		// El cuerpo de choque cabe dentro del cuadro de 32 x 32 del dibujo (se mide en píxeles del dibujo).
		assert.ok(
			jefe.CUERPO_ANCHO <= RECURSOS[jefe.CLAVE].ancho,
			`nivel ${nivel}: el cuerpo es más ancho que el cuadro`,
		);
		assert.ok(
			jefe.CUERPO_ALTO <= RECURSOS[jefe.CLAVE].alto,
			`nivel ${nivel}: el cuerpo es más alto que el cuadro`,
		);
	}
});

test('lo común a los dos jefes (vida, ataques, rayo) sale de una base: cambiar un jefe no cambia al otro', () => {
	assert.equal(JEFES[1].VIDA, JEFES[2].VIDA);
	assert.equal(
		JEFES[1].RAYO,
		JEFES[2].RAYO,
		'comparten el mismo bloque del rayo (viene de la base)',
	);
	assert.notEqual(JEFES[1].NIVELES_DE_INGLES, JEFES[2].NIVELES_DE_INGLES);
	assert.notEqual(JEFES[1].CLAVE, JEFES[2].CLAVE);
});
