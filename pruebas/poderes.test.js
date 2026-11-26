import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PoderConRecarga } from '../src/sistemas/PoderConRecarga.js';
import {
	alcanzadosPorLaExplosion,
	limitarAlRectangulo,
	tiempoDeVuelo,
} from '../src/utilidades/explosion.js';

const ACIERTO = 6000;
const FALLO = 2500;
const crear = () => new PoderConRecarga({ recargaTrasAcierto: ACIERTO, recargaTrasFallo: FALLO });

// --- El poder y su recarga ---

test('un poder nuevo está listo, con la barra llena', () => {
	const poder = crear();
	assert.equal(poder.estaLista(0), true);
	assert.equal(poder.progresoDeLaRecarga(0), 1);
});

test('usarlo lo pone en reto: no se puede usar dos veces y la recarga todavía no corre', () => {
	const poder = crear();
	assert.equal(poder.intentarUsar(1000), true);
	assert.equal(poder.estado, 'en-reto');
	assert.equal(poder.intentarUsar(1001), false, 'mientras se responde el reto no se pide otro');
	assert.equal(
		poder.estaLista(99999),
		false,
		'por mucho tiempo que pase, hasta terminar el reto no recarga',
	);
	assert.equal(poder.progresoDeLaRecarga(99999), 0);
});

test('tras acertar, recarga el tiempo completo contado desde que terminó el reto', () => {
	const poder = crear();
	poder.intentarUsar(1000);
	poder.terminar(true, 5000); // el reto duró 4 s: no se descuentan
	assert.equal(poder.estado, 'recargando');
	assert.equal(poder.progresoDeLaRecarga(5000), 0);
	assert.equal(poder.progresoDeLaRecarga(5000 + ACIERTO / 2), 0.5);
	assert.equal(poder.intentarUsar(5000 + ACIERTO - 1), false);
	assert.equal(
		poder.intentarUsar(5000 + ACIERTO),
		true,
		'justo al cumplirse, vuelve a estar lista',
	);
});

test('tras fallar la recarga es más corta que tras acertar', () => {
	const poder = crear();
	poder.intentarUsar(0);
	poder.terminar(false, 3000);
	assert.equal(poder.estaLista(3000 + FALLO - 1), false);
	assert.equal(poder.estaLista(3000 + FALLO), true);
	assert.ok(FALLO < ACIERTO);
});

test('terminar sin haber un reto no hace nada (ni empieza una recarga)', () => {
	const poder = crear();
	poder.terminar(true, 1000);
	assert.equal(poder.estado, 'lista');
	poder.intentarUsar(2000);
	poder.terminar(true, 3000);
	poder.terminar(false, 4000); // un segundo aviso de fin no cambia la recarga que ya corre
	assert.equal(poder.recargaActual, ACIERTO);
	assert.equal(poder.inicioDeLaRecarga, 3000);
});

test('la barra de recarga nunca sale de 0 a 1, ni con el reloj hacia atrás', () => {
	const poder = crear();
	poder.intentarUsar(1000);
	poder.terminar(true, 2000);
	assert.equal(poder.progresoDeLaRecarga(500), 0, 'el reloj retrocede: no baja de cero');
	assert.equal(poder.progresoDeLaRecarga(2000 + ACIERTO * 3), 1);
});

test('después de recargar se puede repetir el ciclo completo', () => {
	const poder = crear();
	for (let vuelta = 0; vuelta < 3; vuelta += 1) {
		const t = vuelta * 20000;
		assert.equal(poder.intentarUsar(t), true, `vuelta ${vuelta}`);
		poder.terminar(vuelta % 2 === 0, t + 1000);
		assert.equal(poder.estaLista(t + 1000 + ACIERTO), true);
	}
});

// --- La explosión ---

test('alcanzadosPorLaExplosion devuelve solo lo que queda dentro del radio, borde incluido', () => {
	const centro = { x: 100, y: 100 };
	const dentro = { x: 150, y: 100 }; // a 50
	const borde = { x: 100, y: 196 }; // a 96, justo el radio
	const fuera = { x: 100, y: 197 }; // a 97
	const lejos = { x: 400, y: 400 };
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 96, [lejos, dentro, fuera, borde]), [
		dentro,
		borde,
	]);
});

test('la distancia de la explosión es en línea recta, no por ejes', () => {
	const centro = { x: 0, y: 0 };
	const enLaDiagonal = { x: 70, y: 70 }; // a ~99 en línea recta: fuera de 96, aunque x e y <= 96
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 96, [enLaDiagonal]), []);
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 100, [enLaDiagonal]), [enLaDiagonal]);
});

test('alcanzadosPorLaExplosion con la lista vacía no falla y no cambia la lista original', () => {
	assert.deepEqual(alcanzadosPorLaExplosion({ x: 0, y: 0 }, 50, []), []);
	const objetivos = [{ x: 1, y: 1 }];
	alcanzadosPorLaExplosion({ x: 0, y: 0 }, 50, objetivos);
	assert.equal(objetivos.length, 1);
});

// --- El vuelo ---

test('tiempoDeVuelo: distancia entre velocidad, en milisegundos', () => {
	assert.equal(tiempoDeVuelo({ x: 0, y: 0 }, { x: 400, y: 0 }, 400), 1000);
	assert.equal(tiempoDeVuelo({ x: 0, y: 0 }, { x: 300, y: 400 }, 500), 1000); // 500 px en diagonal
	assert.equal(tiempoDeVuelo({ x: 0, y: 0 }, { x: 200, y: 0 }, 400), 500);
});

test('tiempoDeVuelo no baja del mínimo, ni siquiera lanzando a los pies', () => {
	assert.equal(tiempoDeVuelo({ x: 5, y: 5 }, { x: 5, y: 5 }, 400, 150), 150);
	assert.equal(tiempoDeVuelo({ x: 0, y: 0 }, { x: 10, y: 0 }, 400, 150), 150);
	assert.equal(
		tiempoDeVuelo({ x: 5, y: 5 }, { x: 5, y: 5 }, 400),
		0,
		'sin mínimo, a los pies es 0',
	);
});

test('limitarAlRectangulo deja dentro lo que está dentro y acerca lo que está fuera', () => {
	const sala = { x: 800, y: 0, ancho: 800, alto: 640 };
	assert.deepEqual(limitarAlRectangulo({ x: 1000, y: 300 }, sala), { x: 1000, y: 300 });
	assert.deepEqual(limitarAlRectangulo({ x: 100, y: 300 }, sala), { x: 800, y: 300 });
	assert.deepEqual(limitarAlRectangulo({ x: 2000, y: 900 }, sala), { x: 1600, y: 640 });
	assert.deepEqual(limitarAlRectangulo({ x: 1000, y: -50 }, sala), { x: 1000, y: 0 });
});
