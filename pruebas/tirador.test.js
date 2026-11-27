import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Tirador } from '../src/sistemas/Tirador.js';

// El comportamiento de los enemigos que disparan. Es lógica pura: el tiempo y la distancia entran como parámetros.
const crear = (extra = {}) =>
	new Tirador({
		intervalo: 2000,
		aviso: 500,
		alcance: 400,
		distanciaMinima: 150,
		distanciaMaxima: 250,
		primerDisparo: 1000,
		...extra,
	});

test('se acerca si está más lejos que su franja, se aleja si está más cerca y en medio se queda quieto', () => {
	const t = crear();
	assert.equal(t.actualizar(0, 300).movimiento, 'acercarse');
	assert.equal(t.actualizar(0, 100).movimiento, 'alejarse');
	assert.equal(t.actualizar(0, 200).movimiento, 'quieto');
});

test('los bordes de la franja cuentan como dentro de ella (no se mueve justo en 150 ni en 250)', () => {
	const t = crear();
	assert.equal(t.actualizar(0, 250).movimiento, 'quieto');
	assert.equal(t.actualizar(0, 150).movimiento, 'quieto');
	assert.equal(t.actualizar(0, 250.01).movimiento, 'acercarse');
	assert.equal(t.actualizar(0, 149.99).movimiento, 'alejarse');
});

test('antes de su primer disparo no apunta, aunque el jugador esté a su alcance', () => {
	const t = crear();
	const accion = t.actualizar(999, 200);
	assert.equal(accion.apuntando, false);
	assert.equal(accion.disparar, false);
});

test('cuando le toca y el jugador está a su alcance, se detiene a apuntar y dispara al terminar el aviso', () => {
	const t = crear();
	assert.deepEqual(t.actualizar(1000, 200), {
		movimiento: 'quieto',
		apuntando: true,
		disparar: false,
	});
	assert.deepEqual(t.actualizar(1400, 200), {
		movimiento: 'quieto',
		apuntando: true,
		disparar: false,
	});
	assert.deepEqual(t.actualizar(1499, 200), {
		movimiento: 'quieto',
		apuntando: true,
		disparar: false,
	});
	assert.deepEqual(t.actualizar(1500, 200), {
		movimiento: 'quieto',
		apuntando: false,
		disparar: true,
	});
});

test('mientras apunta no se mueve, aunque el jugador se acerque o se aleje', () => {
	const t = crear();
	t.actualizar(1000, 200);
	assert.equal(t.actualizar(1100, 50).movimiento, 'quieto');
	assert.equal(t.actualizar(1200, 390).movimiento, 'quieto');
});

test('dispara solo en el fotograma exacto, y después espera el intervalo completo', () => {
	const t = crear();
	t.actualizar(1000, 200);
	assert.equal(t.actualizar(1500, 200).disparar, true);
	assert.equal(t.actualizar(1516, 200).disparar, false, 'no repite en el siguiente fotograma');

	// El siguiente puede empezar a apuntar a los 2000 ms del disparo (1500 + 2000).
	assert.equal(t.actualizar(3499, 200).apuntando, false);
	assert.equal(t.actualizar(3500, 200).apuntando, true);
	assert.equal(t.actualizar(4000, 200).disparar, true);
});

test('fuera de su alcance no apunta: sigue moviéndose, y apunta en cuanto el jugador entra', () => {
	const t = crear({ primerDisparo: 0 });
	assert.deepEqual(t.actualizar(5000, 500), {
		movimiento: 'acercarse',
		apuntando: false,
		disparar: false,
	});
	assert.equal(t.actualizar(5010, 400).apuntando, true, 'justo en el alcance cuenta');
});

test('si el jugador se va a mitad del aviso, el disparo sale igual (la bala va hacia donde estaba)', () => {
	const t = crear();
	t.actualizar(1000, 200);
	assert.equal(t.actualizar(1500, 900).disparar, true);
});

test('con aviso 0 dispara en cuanto le toca, sin detenerse a apuntar', () => {
	const t = crear({ aviso: 0 });
	assert.deepEqual(t.actualizar(1000, 200), {
		movimiento: 'quieto',
		apuntando: false,
		disparar: true,
	});
	assert.equal(t.actualizar(1001, 200).disparar, false);
});

test('un tirador con otra franja y otro ritmo se comporta como se le pide (el escopetero)', () => {
	const t = crear({
		intervalo: 2600,
		aviso: 550,
		alcance: 340,
		distanciaMinima: 90,
		distanciaMaxima: 200,
	});
	assert.equal(t.actualizar(0, 300).movimiento, 'acercarse', 'avanza hasta quedar cerca');
	assert.equal(t.actualizar(0, 120).movimiento, 'quieto', 'y ahí se queda');
	assert.equal(t.actualizar(0, 60).movimiento, 'alejarse');

	assert.equal(t.actualizar(1000, 120).apuntando, true);
	assert.equal(t.actualizar(1549, 120).disparar, false);
	assert.equal(t.actualizar(1550, 120).disparar, true);
});

test('dos tiradores con el mismo reloj y distinto primerDisparo no disparan a la vez', () => {
	const a = crear({ primerDisparo: 900 });
	const b = crear({ primerDisparo: 1500 });
	assert.equal(a.actualizar(1000, 200).apuntando, true);
	assert.equal(b.actualizar(1000, 200).apuntando, false);
});
