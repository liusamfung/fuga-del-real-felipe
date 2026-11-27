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
