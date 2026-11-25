import assert from 'node:assert/strict';
import { test } from 'node:test';
import { elegirAlAzar } from '../src/utilidades/azar.js';
import { normalizar } from '../src/utilidades/vectores.js';

test('normalizar deja la dirección con largo 1', () => {
	assert.deepEqual(normalizar(3, 4), { x: 0.6, y: 0.8 });
	assert.deepEqual(normalizar(0, -5), { x: 0, y: -1 });
});

test('ir en diagonal no es más rápido que ir recto', () => {
	const { x, y } = normalizar(1, 1);

	assert.ok(Math.abs(Math.hypot(x, y) - 1) < 1e-12);
});

test('normalizar no divide por cero: sin dirección devuelve (0, 0)', () => {
	assert.deepEqual(normalizar(0, 0), { x: 0, y: 0 });
});

test('elegirAlAzar elige el elemento que corresponde al número recibido', () => {
	const lista = ['a', 'b', 'c', 'd'];

	assert.equal(
		elegirAlAzar(lista, () => 0),
		'a',
	);
	assert.equal(
		elegirAlAzar(lista, () => 0.26),
		'b',
	);
	assert.equal(
		elegirAlAzar(lista, () => 0.999999),
		'd',
	);
});
