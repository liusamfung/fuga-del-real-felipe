import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Dash } from '../src/sistemas/Dash.js';
import { VECTORES_DE_DIRECCION } from '../src/utilidades/vectores.js';

const DURACION = 150;
const RECARGA = 1200;
const DERECHA = VECTORES_DE_DIRECCION.derecha;
const crearDash = (cargasMaximas = 1) =>
	new Dash({ duracion: DURACION, recarga: RECARGA, cargasMaximas });

test('un dash recién creado está listo, con 1 carga y la recarga completa', () => {
	const dash = crearDash();

	assert.equal(dash.cargasDisponibles(0), 1);
	assert.equal(dash.progresoDeLaRecarga(0), 1);
	assert.equal(dash.estaActivo(0), false);
});

test('al usarlo empieza el impulso en la dirección pedida y dura lo que dice la duración', () => {
	const dash = crearDash();

	assert.equal(dash.intentar(DERECHA, 1000), true);
	assert.deepEqual(dash.direccion, DERECHA);
	assert.equal(dash.estaActivo(1000), true);
	assert.equal(dash.estaActivo(1000 + DURACION - 1), true);
	assert.equal(dash.estaActivo(1000 + DURACION), false);
});

test('con 1 carga no se puede repetir hasta que pasa la recarga completa', () => {
	const dash = crearDash();
	dash.intentar(DERECHA, 1000);

	assert.equal(dash.intentar(DERECHA, 1000 + DURACION), false, 'justo al terminar el impulso');
	assert.equal(dash.intentar(DERECHA, 1000 + RECARGA - 1), false, 'un instante antes de recargar');
	assert.equal(dash.intentar(DERECHA, 1000 + RECARGA), true, 'al cumplirse la recarga');
});

test('no se puede empezar otro dash en pleno impulso, aunque queden cargas', () => {
	const dash = crearDash(2);
	dash.intentar(DERECHA, 1000);

	assert.equal(dash.intentar(DERECHA, 1000 + DURACION - 1), false);
	assert.equal(dash.cargasDisponibles(1000 + 10), 1);
});

test('DobleDash: se pueden usar dos dashes seguidos y el tercero no', () => {
	const dash = crearDash(2);

	assert.equal(dash.intentar(DERECHA, 1000), true);
	assert.equal(dash.cargasDisponibles(1000 + DURACION), 1);
	assert.equal(
		dash.intentar(DERECHA, 1000 + DURACION),
		true,
		'el segundo, apenas termina el primero',
	);
	assert.equal(dash.cargasDisponibles(1000 + 2 * DURACION), 0);
	assert.equal(dash.intentar(DERECHA, 1000 + 2 * DURACION), false, 'el tercero');
});

test('DobleDash comparte la recarga: el segundo uso no la reinicia', () => {
	const dash = crearDash(2);
	dash.intentar(DERECHA, 1000);
	dash.intentar(DERECHA, 1500); // segundo uso, 500 ms después del primero

	// La recarga se cuenta desde el PRIMER uso: a los 1200 ms vuelven las dos cargas.
	assert.equal(dash.cargasDisponibles(1000 + RECARGA - 1), 0);
	assert.equal(dash.cargasDisponibles(1000 + RECARGA), 2);
	// Si el segundo uso hubiera reiniciado la recarga, todavía faltarían 500 ms.
	assert.equal(dash.intentar(DERECHA, 1000 + RECARGA), true);
});

test('el progreso de la recarga va de 0 a 1 desde el primer uso', () => {
	const dash = crearDash();
	dash.intentar(DERECHA, 1000);

	assert.equal(dash.progresoDeLaRecarga(1000), 0);
	assert.equal(dash.progresoDeLaRecarga(1000 + RECARGA / 2), 0.5);
	assert.equal(dash.progresoDeLaRecarga(1000 + RECARGA), 1);
	assert.equal(dash.progresoDeLaRecarga(1000 + 5 * RECARGA), 1, 'nunca pasa de 1');
});

test('si el reloj retrocede, el progreso de la recarga no se sale del rango de 0 a 1', () => {
	const dash = crearDash();
	dash.intentar(DERECHA, 1000);

	assert.equal(dash.progresoDeLaRecarga(500), 0);
});

test('activarDobleDash convierte un dash de 1 carga en uno de 2', () => {
	const dash = crearDash();
	assert.equal(dash.cargasDisponibles(0), 1);

	dash.activarDobleDash();

	assert.equal(dash.cargasDisponibles(0), 2);
});

test('los vectores de dirección tienen largo 1 y apuntan hacia donde dice su nombre', () => {
	assert.deepEqual(VECTORES_DE_DIRECCION.abajo, { x: 0, y: 1 });
	assert.deepEqual(VECTORES_DE_DIRECCION.arriba, { x: 0, y: -1 });
	assert.deepEqual(VECTORES_DE_DIRECCION.derecha, { x: 1, y: 0 });
	assert.deepEqual(VECTORES_DE_DIRECCION.izquierda, { x: -1, y: 0 });
});
