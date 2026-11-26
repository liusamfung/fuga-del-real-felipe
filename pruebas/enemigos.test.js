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

test('la vida, la velocidad y el daño de cada tipo son números positivos', () => {
	for (const [nombre, { vida, velocidad, dano }] of tipos) {
		for (const [campo, valor] of Object.entries({ vida, velocidad, dano })) {
			assert.ok(Number.isFinite(valor) && valor > 0, `${nombre}: ${campo} = ${valor}`);
		}
		assert.ok(
			Number.isInteger(vida) && Number.isInteger(dano),
			`${nombre}: vida y daño son enteros`,
		);
	}
});

test('cada rata tiene su carácter: la blanca es la más veloz, la azul la más lenta y resistente, la negra la que más daño hace', () => {
	const { debil, ...ratas } = TIPOS_DE_ENEMIGO;
	const maximo = (campo) => Math.max(...Object.values(ratas).map((r) => r[campo]));
	const minimo = (campo) => Math.min(...Object.values(ratas).map((r) => r[campo]));

	assert.equal(ratas['rata-blanca'].velocidad, maximo('velocidad'), 'la blanca es la más veloz');
	assert.ok(
		ratas['rata-blanca'].velocidad >= 2 * ratas['rata-gris'].velocidad,
		'la blanca es al menos el doble de rápida que la gris',
	);
	assert.equal(ratas['rata-azul'].velocidad, minimo('velocidad'), 'la azul es la más lenta');
	assert.equal(ratas['rata-azul'].vida, maximo('vida'), 'la azul es la más resistente');
	assert.equal(ratas['rata-negra'].dano, maximo('dano'), 'la negra es la que más daño hace');
	assert.ok(ratas['rata-negra'].dano > 1);
	// La gris es la plaga: frágil y de velocidad normal (la del enemigo débil de siempre).
	assert.equal(ratas['rata-gris'].vida, minimo('vida'));
	assert.equal(ratas['rata-gris'].velocidad, debil.velocidad);
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
