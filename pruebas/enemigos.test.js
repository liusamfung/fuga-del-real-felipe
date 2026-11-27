import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANIMACIONES } from '../src/datos/animaciones.js';
import { NOMBRES_DE_TIPOS, TIPOS_DE_ENEMIGO } from '../src/datos/enemigos.js';
import { NIVEL_1, NIVEL_2 } from '../src/datos/niveles.js';
import { RECURSOS } from '../src/datos/recursos.js';

const tipos = Object.entries(TIPOS_DE_ENEMIGO);

test('hay siete tipos: el débil de siempre, las cuatro ratas y los dos guardias', () => {
	assert.deepEqual([...NOMBRES_DE_TIPOS].sort(), [
		'debil',
		'guardia-azul',
		'guardia-rojo',
		'rata-azul',
		'rata-blanca',
		'rata-gris',
		'rata-negra',
	]);
});

test('cada tipo tiene su hoja de cuadros de 32×48 y su animación de caminar (2 cuadros las ratas, 3 los guardias)', () => {
	for (const [nombre, tipo] of tipos) {
		const hoja = RECURSOS[tipo.textura];
		assert.ok(hoja, `${nombre}: no existe la hoja «${tipo.textura}»`);
		assert.equal(hoja.tipo, 'hoja', nombre);
		assert.equal(hoja.ancho, 32, nombre);
		assert.equal(hoja.alto, 48, nombre);

		const animacion = ANIMACIONES.find((a) => a.clave === tipo.animacion);
		assert.ok(animacion, `${nombre}: no existe la animación «${tipo.animacion}»`);
		assert.equal(animacion.textura, tipo.textura, `${nombre}: la animación usa otra hoja`);
		// Los guardias tienen 3 cuadros (de pie y dos pasos): van de pie → paso → de pie → otro paso.
		assert.deepEqual(animacion.cuadros, tipo.disparo ? [0, 1, 0, 2] : [0, 1], nombre);
	}
});

test('la vida y la velocidad son números positivos, y el daño es un entero positivo o el tipo es letal', () => {
	for (const [nombre, tipo] of tipos) {
		for (const campo of ['vida', 'velocidad']) {
			assert.ok(
				Number.isFinite(tipo[campo]) && tipo[campo] > 0,
				`${nombre}: ${campo} = ${tipo[campo]}`,
			);
		}
		assert.ok(Number.isInteger(tipo.vida), `${nombre}: la vida es un entero`);

		if (tipo.letal === true) {
			assert.equal(tipo.dano, undefined, `${nombre}: un tipo letal no lleva daño`);
		} else {
			assert.ok(Number.isInteger(tipo.dano) && tipo.dano > 0, `${nombre}: daño = ${tipo.dano}`);
		}
	}
});

test('cada rata tiene su carácter: gris (plaga: frágil, daña 2), blanca (veloz, 2 balas), azul (lenta), negra (10 vidas, letal)', () => {
	const { debil, ...ratas } = TIPOS_DE_ENEMIGO;
	const maximo = (campo) => Math.max(...Object.values(ratas).map((r) => r[campo]));
	const minimo = (campo) => Math.min(...Object.values(ratas).map((r) => r[campo]));

	// La gris: la plaga. Frágil (una bala), de velocidad normal, y cada mordida quita 2 corazones.
	assert.equal(ratas['rata-gris'].vida, minimo('vida'), 'la gris es la más frágil');
	assert.equal(ratas['rata-gris'].vida, 1);
	assert.equal(ratas['rata-gris'].velocidad, debil.velocidad, 'la gris va a velocidad normal');
	assert.equal(ratas['rata-gris'].dano, 2, 'cada mordida de la gris quita 2 corazones');

	// La blanca: la veloz. Más del doble de rápida que la gris y aguanta exactamente 2 balas.
	assert.equal(ratas['rata-blanca'].velocidad, maximo('velocidad'), 'la blanca es la más veloz');
	assert.ok(ratas['rata-blanca'].velocidad >= 2 * ratas['rata-gris'].velocidad);
	assert.equal(ratas['rata-blanca'].vida, 2, 'dos balas deben matar a la blanca');

	// La azul: la acorazada, la más lenta.
	assert.equal(ratas['rata-azul'].velocidad, minimo('velocidad'), 'la azul es la más lenta');
	assert.ok(ratas['rata-azul'].vida > ratas['rata-blanca'].vida);

	// La negra: 10 vidas (la más resistente) y mata de un solo toque.
	assert.equal(ratas['rata-negra'].vida, 10, 'la negra tiene 10 vidas');
	assert.equal(ratas['rata-negra'].vida, maximo('vida'), 'la negra es la más resistente');
	assert.equal(ratas['rata-negra'].letal, true, 'la negra mata de un solo toque');
	for (const [nombre, tipo] of Object.entries(ratas)) {
		if (nombre !== 'rata-negra') {
			assert.notEqual(tipo.letal, true, `${nombre} no debe ser letal`);
		}
	}
});

test('ninguna rata persigue más rápido que el jugador camina (si no, no habría cómo huir)', () => {
	for (const [nombre, { velocidad }] of tipos) {
		assert.ok(velocidad < 220, `${nombre}: ${velocidad} px/s`);
	}
});

test('hay una sala con la plaga (5 o más ratas grises) y todos los tipos se usan en alguna sala', () => {
	const enemigos = [...NIVEL_1.salas, ...NIVEL_2.salas].flatMap((sala) => sala.enemigos);
	const usados = new Set(enemigos.map(({ tipo }) => tipo));
	assert.deepEqual(
		[...usados].sort(),
		[...NOMBRES_DE_TIPOS].sort(),
		'hay un tipo que no sale nunca',
	);

	const grisesPorSala = NIVEL_1.salas.map(
		(s) => s.enemigos.filter((e) => e.tipo === 'rata-gris').length,
	);
	assert.ok(Math.max(...grisesPorSala) >= 5, 'ninguna sala tiene la plaga de ratas grises');
});

// --- Los guardias que disparan (nivel 2) ---

const guardias = tipos.filter(([, tipo]) => tipo.disparo);

test('los dos guardias disparan y ninguna rata ni el débil lo hace', () => {
	assert.deepEqual(guardias.map(([nombre]) => nombre).sort(), ['guardia-azul', 'guardia-rojo']);
	for (const [nombre, tipo] of tipos) {
		assert.equal(tipo.disparo !== undefined, nombre.startsWith('guardia'), nombre);
	}
});

test('el disparo de cada guardia está completo y es coherente', () => {
	for (const [nombre, { disparo }] of guardias) {
		assert.ok(
			['simple', 'abanico'].includes(disparo.patron),
			`${nombre}: patrón «${disparo.patron}»`,
		);
		for (const campo of [
			'velocidad',
			'intervalo',
			'alcance',
			'distanciaMinima',
			'distanciaMaxima',
		]) {
			assert.ok(disparo[campo] > 0, `${nombre}: ${campo} = ${disparo[campo]}`);
		}
		for (const campo of ['aviso', 'primerDisparo', 'variacion']) {
			assert.ok(disparo[campo] >= 0, `${nombre}: ${campo} = ${disparo[campo]}`);
		}
		assert.ok(Number.isInteger(disparo.dano) && disparo.dano > 0, `${nombre}: daño`);

		const dibujo = RECURSOS[disparo.textura];
		assert.ok(dibujo, `${nombre}: no existe el dibujo de la bala «${disparo.textura}»`);
		assert.equal(dibujo.tipo, 'generado', nombre);

		if (disparo.patron === 'abanico') {
			assert.ok(Number.isInteger(disparo.cantidad) && disparo.cantidad >= 2, `${nombre}: cantidad`);
			assert.ok(disparo.apertura >= 10 && disparo.apertura <= 45, `${nombre}: apertura`);
		}
	}
});

test('un guardia puede disparar sin salirse de su franja: el alcance llega hasta donde se queda', () => {
	for (const [nombre, { disparo }] of guardias) {
		assert.ok(
			disparo.distanciaMinima < disparo.distanciaMaxima,
			`${nombre}: la franja está al revés`,
		);
		assert.ok(
			disparo.alcance >= disparo.distanciaMaxima,
			`${nombre}: se queda a ${disparo.distanciaMaxima} px pero solo alcanza a ${disparo.alcance}`,
		);
		// El tiempo entre disparos incluye el aviso: no se puede apuntar más tiempo del que hay entre disparos.
		assert.ok(disparo.aviso < disparo.intervalo, `${nombre}: el aviso no cabe en el intervalo`);
	}
});

test('los dos guardias disparan DISTINTO: patrón, ritmo, aviso y distancia (el pedido del usuario)', () => {
	const azul = TIPOS_DE_ENEMIGO['guardia-azul'];
	const rojo = TIPOS_DE_ENEMIGO['guardia-rojo'];

	assert.notEqual(azul.disparo.patron, rojo.disparo.patron, 'los dos usan el mismo patrón');
	assert.ok(azul.disparo.intervalo < rojo.disparo.intervalo, 'el tirador dispara más seguido');
	assert.ok(azul.disparo.aviso < rojo.disparo.aviso, 'el escopetero avisa más tiempo');
	assert.ok(azul.disparo.velocidad > rojo.disparo.velocidad, 'la bala del tirador es más rápida');
	assert.ok(
		azul.disparo.distanciaMinima >= rojo.disparo.distanciaMaxima,
		'el tirador se queda más lejos',
	);
	assert.ok(rojo.vida > azul.vida, 'el escopetero aguanta más');
});

test('la bala del tirador es más rápida que el jugador, pero ningún guardia lo persigue más rápido', () => {
	assert.ok(TIPOS_DE_ENEMIGO['guardia-azul'].disparo.velocidad > 220);
	for (const [nombre, { velocidad }] of guardias) {
		assert.ok(velocidad < 220, `${nombre} se mueve a ${velocidad} px/s`);
	}
});
