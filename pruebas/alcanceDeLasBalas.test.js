import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { superoElAlcance } from '../src/utilidades/alcance.js';

// El alcance de las balas del jugador (27/11/2026): una bala ya no cruza toda la sala.

test('una bala llega a su alcance cuando está a esa distancia en línea recta, borde incluido', () => {
	const origen = { x: 100, y: 100 };
	assert.equal(superoElAlcance(origen, { x: 499, y: 100 }, 400), false); // a 399
	assert.equal(superoElAlcance(origen, { x: 500, y: 100 }, 400), true); // a 400: justo el alcance
	assert.equal(superoElAlcance(origen, { x: 600, y: 100 }, 400), true);
});

test('el alcance se mide en línea recta, también en diagonal y hacia atrás', () => {
	const origen = { x: 0, y: 0 };
	assert.equal(superoElAlcance(origen, { x: 280, y: 280 }, 400), false); // a ~396
	assert.equal(superoElAlcance(origen, { x: 285, y: 285 }, 400), true); // a ~403
	assert.equal(superoElAlcance(origen, { x: -300, y: -300 }, 400), true);
});

test('una bala recién disparada no ha llegado a su alcance', () => {
	assert.equal(superoElAlcance({ x: 50, y: 50 }, { x: 50, y: 50 }, 400), false);
});

test('el alcance configurado es positivo y menor que una sala: la bala no cruza todo el mapa', () => {
	const { ALCANCE } = CONFIG.DISPARO;
	assert.ok(ALCANCE > 0);
	assert.ok(ALCANCE < CONFIG.SALA.ANCHO, 'debe quedarse corto de una pared a la otra');
	assert.ok(ALCANCE < CONFIG.SALA.ALTO);
	// Pero alcanza para pelear: más que el radio de la granada y que lo que mide un enemigo.
	assert.ok(ALCANCE > CONFIG.PODERES.GRANADA.RADIO * 2);
});
