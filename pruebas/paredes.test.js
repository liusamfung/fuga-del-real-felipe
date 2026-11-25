import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import {
	LADOS,
	ladoOpuesto,
	rectanguloDePuerta,
	segmentosDeParedes,
} from '../src/utilidades/paredes.js';

const { ANCHO, ALTO, CASILLA, ANCHO_PUERTA } = CONFIG.SALA;
const MEDIDAS = { ancho: ANCHO, alto: ALTO, grosor: CASILLA, anchoPuerta: ANCHO_PUERTA };
const area = (rectangulos) => rectangulos.reduce((suma, r) => suma + r.ancho * r.alto, 0);
const solapan = (a, b) =>
	a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;

test('el lado opuesto de cada lado es el contrario, y volver da el mismo lado', () => {
	assert.equal(ladoOpuesto('arriba'), 'abajo');
	assert.equal(ladoOpuesto('izquierda'), 'derecha');
	for (const lado of LADOS) {
		assert.equal(ladoOpuesto(ladoOpuesto(lado)), lado);
	}
});

test('el hueco de cada puerta está centrado en su pared y tiene el grosor de la pared', () => {
	assert.deepEqual(rectanguloDePuerta('arriba', MEDIDAS), { x: 352, y: 0, ancho: 96, alto: 32 });
	assert.deepEqual(rectanguloDePuerta('abajo', MEDIDAS), { x: 352, y: 608, ancho: 96, alto: 32 });
	assert.deepEqual(rectanguloDePuerta('izquierda', MEDIDAS), { x: 0, y: 272, ancho: 32, alto: 96 });
	assert.deepEqual(rectanguloDePuerta('derecha', MEDIDAS), { x: 768, y: 272, ancho: 32, alto: 96 });
	assert.throws(() => rectanguloDePuerta('diagonal', MEDIDAS), /Lado desconocido/);
});

test('sin puertas las paredes cubren todo el borde de la sala', () => {
	const paredes = segmentosDeParedes(MEDIDAS, []);
	const borde = 2 * ANCHO * CASILLA + 2 * CASILLA * (ALTO - 2 * CASILLA);

	assert.equal(paredes.length, 4);
	assert.equal(area(paredes), borde);
});

test('cada puerta le quita a la pared exactamente el área de su hueco', () => {
	const sinPuertas = area(segmentosDeParedes(MEDIDAS, []));

	for (const lado of LADOS) {
		const hueco = rectanguloDePuerta(lado, MEDIDAS);
		assert.equal(area(segmentosDeParedes(MEDIDAS, [lado])), sinPuertas - hueco.ancho * hueco.alto);
	}
	assert.equal(area(segmentosDeParedes(MEDIDAS, LADOS)), sinPuertas - 4 * ANCHO_PUERTA * CASILLA);
});

test('ninguna pared tapa el hueco de una puerta', () => {
	const paredes = segmentosDeParedes(MEDIDAS, LADOS);

	for (const lado of LADOS) {
		const hueco = rectanguloDePuerta(lado, MEDIDAS);
		for (const pared of paredes) {
			assert.ok(!solapan(pared, hueco), `una pared tapa la puerta de ${lado}`);
		}
	}
});
