import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANIMACIONES } from '../src/datos/animaciones.js';
import { NOMBRES_DE_TIPOS, TIPOS_DE_ENEMIGO } from '../src/datos/enemigos.js';
import { NIVEL_1 } from '../src/datos/niveles.js';
import { RECURSOS } from '../src/datos/recursos.js';

const tipos = Object.entries(TIPOS_DE_ENEMIGO);

test('hay cinco tipos: el débil de siempre y las cuatro ratas', () => {
	assert.deepEqual([...NOMBRES_DE_TIPOS].sort(), [
		'debil',
		'rata-azul',
		'rata-blanca',
		'rata-gris',
		'rata-negra',
	]);
});

test('cada tipo tiene su hoja de 2 cuadros de 32×48 y su animación de caminar', () => {
	for (const [nombre, tipo] of tipos) {
		const hoja = RECURSOS[tipo.textura];
		assert.ok(hoja, `${nombre}: no existe la hoja «${tipo.textura}»`);
		assert.equal(hoja.tipo, 'hoja', nombre);
		assert.equal(hoja.ancho, 32, nombre);
		assert.equal(hoja.alto, 48, nombre);

		const animacion = ANIMACIONES.find((a) => a.clave === tipo.animacion);
		assert.ok(animacion, `${nombre}: no existe la animación «${tipo.animacion}»`);
		assert.equal(animacion.textura, tipo.textura, `${nombre}: la animación usa otra hoja`);
		assert.deepEqual(animacion.cuadros, [0, 1], nombre);
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
	const enemigos = NIVEL_1.salas.flatMap((sala) => sala.enemigos);
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
