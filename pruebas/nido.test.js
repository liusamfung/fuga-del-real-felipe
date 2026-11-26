import assert from 'node:assert/strict';
import { test } from 'node:test';
import { puntoDeSalidaDelNido } from '../src/utilidades/nido.js';

const SALA = { ancho: 800, alto: 640, grosor: 32 };
const CUERPO = { ancho: 32, alto: 48 };
// Un nido de 64×64 en el medio de la sala, lejos de las paredes: caben las cuatro salidas.
const NIDO = { x: 368, y: 288, ancho: 64, alto: 64 };

const solapan = (a, b) =>
	a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
const cuerpoEn = ({ x, y }) => ({ x: x - 16, y: y - 24, ancho: 32, alto: 48 });

test('la rata sale pegada al nido, con 4 px de aire, y nunca dentro de él', () => {
	const punto = puntoDeSalidaDelNido(NIDO, [], SALA, CUERPO);
	const rata = cuerpoEn(punto);
	assert.ok(!solapan(rata, NIDO));

	const separacionVertical = Math.max(NIDO.y - (rata.y + rata.alto), rata.y - (NIDO.y + NIDO.alto));
	const separacionHorizontal = Math.max(
		NIDO.x - (rata.x + rata.ancho),
		rata.x - (NIDO.x + NIDO.ancho),
	);
	assert.ok(
		Math.max(separacionVertical, separacionHorizontal) === 4,
		'hay 4 px de aire por un lado',
	);
});

test('prefiere salir hacia el centro de la sala (no pegada a una pared)', () => {
	// Nido cerca de la pared de arriba: lo natural es salir hacia abajo, hacia adentro.
	const arriba = puntoDeSalidaDelNido({ x: 368, y: 100, ancho: 64, alto: 64 }, [], SALA, CUERPO);
	assert.ok(arriba.y > 100 + 64, 'sale por abajo');
	// Nido cerca de la pared de abajo: sale por arriba.
	const abajo = puntoDeSalidaDelNido({ x: 368, y: 480, ancho: 64, alto: 64 }, [], SALA, CUERPO);
	assert.ok(abajo.y < 480, 'sale por arriba');
	// Nido en la esquina de arriba a la izquierda: el lado más cercano al centro es abajo o la derecha.
	const esquina = puntoDeSalidaDelNido({ x: 96, y: 96, ancho: 64, alto: 64 }, [], SALA, CUERPO);
	assert.ok(esquina.x > 96 + 64 || esquina.y > 96 + 64, 'sale hacia adentro');
});

test('si un lado está ocupado por una caja, sale por otro', () => {
	const sinCaja = puntoDeSalidaDelNido(NIDO, [], SALA, CUERPO);
	const cajaAhi = { x: sinCaja.x - 32, y: sinCaja.y - 32, ancho: 64, alto: 64 };
	const conCaja = puntoDeSalidaDelNido(NIDO, [cajaAhi], SALA, CUERPO);

	assert.ok(conCaja, 'sigue habiendo salida');
	assert.notDeepEqual(conCaja, sinCaja, 'ya no sale por donde había una caja');
	assert.ok(!solapan(cuerpoEn(conCaja), cajaAhi));
});

test('un lado que se sale de las paredes no sirve: el nido pegado a una pared sale por otro lado', () => {
	// Nido pegado a la pared de la izquierda (la pared mide 32): por la izquierda no cabe.
	const punto = puntoDeSalidaDelNido({ x: 32, y: 288, ancho: 64, alto: 64 }, [], SALA, CUERPO);
	assert.ok(punto);
	assert.ok(cuerpoEn(punto).x >= SALA.grosor, 'la rata no sale dentro de la pared');
});

test('si el único lado libre se sale de las paredes, no sirve: devuelve null (no sale dentro de la pared)', () => {
	// Nido pegado a la pared de la izquierda. Se tapan los otros tres lados con cajas: el único que queda es
	// el de la izquierda, y la rata saldría dentro de la pared.
	const nido = { x: 32, y: 288, ancho: 64, alto: 64 };
	const cajas = [
		{ x: 20, y: 356, ancho: 90, alto: 80 }, // abajo
		{ x: 20, y: 200, ancho: 90, alto: 84 }, // arriba
		{ x: 100, y: 280, ancho: 60, alto: 80 }, // derecha
	];
	assert.equal(puntoDeSalidaDelNido(nido, cajas, SALA, CUERPO), null);

	// Y si se deja libre el lado de abajo, sale por ahí.
	const conSalida = puntoDeSalidaDelNido(
		nido,
		cajas.filter((c) => c.y !== 356),
		SALA,
		CUERPO,
	);
	assert.ok(conSalida);
	assert.ok(cuerpoEn(conSalida).x >= SALA.grosor);
});

test('si no cabe por ningún lado, devuelve null', () => {
	const rodeado = [
		{ x: 300, y: 352, ancho: 200, alto: 100 }, // abajo
		{ x: 300, y: 200, ancho: 200, alto: 86 }, // arriba
		{ x: 436, y: 280, ancho: 60, alto: 80 }, // derecha
		{ x: 304, y: 280, ancho: 60, alto: 80 }, // izquierda
	];
	assert.equal(puntoDeSalidaDelNido(NIDO, rodeado, SALA, CUERPO), null);
});

test('no cambia la lista de obstáculos que se le pasa', () => {
	const obstaculos = [{ x: 0, y: 0, ancho: 10, alto: 10 }];
	puntoDeSalidaDelNido(NIDO, obstaculos, SALA, CUERPO);
	assert.deepEqual(obstaculos, [{ x: 0, y: 0, ancho: 10, alto: 10 }]);
});

test('con otro tamaño de enemigo, el punto cambia para que quepa pegado', () => {
	const chico = puntoDeSalidaDelNido(NIDO, [], SALA, { ancho: 16, alto: 16 });
	const grande = puntoDeSalidaDelNido(NIDO, [], SALA, { ancho: 64, alto: 96 });
	assert.ok(
		Math.abs(grande.y - NIDO.y) > Math.abs(chico.y - NIDO.y) ||
			Math.abs(grande.x - NIDO.x) > Math.abs(chico.x - NIDO.x),
	);
});
