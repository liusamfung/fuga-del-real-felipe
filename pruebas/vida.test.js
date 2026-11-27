import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { MEJORAS_COMUNES } from '../src/datos/recompensas.js';
import { RECURSOS } from '../src/datos/recursos.js';
import { aplicarDano, corazonesAMostrar } from '../src/utilidades/vida.js';

// La vida del jugador (27/11/2026): 3 corazones base que no suben; los corazones de los cofres son EXTRA y temporales:
// absorben el daño primero y se pierden. Los base perdidos se ven en gris y no se recuperan.

test('el jugador empieza con 3 corazones base', () => {
	assert.equal(CONFIG.JUGADOR.VIDA_INICIAL, 3);
});

test('sin corazones extra, el daño resta de los corazones base', () => {
	assert.deepEqual(aplicarDano({ vida: 3, vidaExtra: 0 }, 1), { vida: 2, vidaExtra: 0 });
	assert.deepEqual(aplicarDano({ vida: 3, vidaExtra: 0 }, 2), { vida: 1, vidaExtra: 0 });
});

test('los corazones extra absorben el daño primero: los base no se tocan mientras haya extras', () => {
	assert.deepEqual(aplicarDano({ vida: 3, vidaExtra: 2 }, 1), { vida: 3, vidaExtra: 1 });
	assert.deepEqual(aplicarDano({ vida: 3, vidaExtra: 2 }, 2), { vida: 3, vidaExtra: 0 });
});

test('si el daño es mayor que los extra, lo que sobra se resta de los corazones base', () => {
	// El rayo del jefe quita 2: con 1 extra, se pierde el extra y 1 corazón base.
	assert.deepEqual(aplicarDano({ vida: 3, vidaExtra: 1 }, 2), { vida: 2, vidaExtra: 0 });
	assert.deepEqual(aplicarDano({ vida: 2, vidaExtra: 1 }, 5), { vida: 0, vidaExtra: 0 });
});

test('los corazones base nunca bajan de 0 y quien llega a 0 está muerto', () => {
	assert.deepEqual(aplicarDano({ vida: 1, vidaExtra: 0 }, 3), { vida: 0, vidaExtra: 0 });
	assert.deepEqual(aplicarDano({ vida: 0, vidaExtra: 0 }, 1), { vida: 0, vidaExtra: 0 });
});

test('un golpe letal (daño infinito) mata aunque haya corazones extra: no se pueden usar de escudo', () => {
	// Los enemigos «letales» hacen `Infinity` de daño (ver `Enemigo`): ni todos los extra del mundo los absorben.
	assert.deepEqual(aplicarDano({ vida: 3, vidaExtra: 5 }, Infinity), { vida: 0, vidaExtra: 0 });
});

test('un golpe de 0 no cambia nada, y aplicarDano no modifica el objeto que recibe', () => {
	const antes = { vida: 2, vidaExtra: 1 };
	assert.deepEqual(aplicarDano(antes, 0), { vida: 2, vidaExtra: 1 });
	aplicarDano(antes, 2);
	assert.deepEqual(antes, { vida: 2, vidaExtra: 1 });
});

test('corazonesAMostrar suma los base (llenos o grises) y los extra', () => {
	assert.equal(corazonesAMostrar({ vidaMaxima: 3, vidaExtra: 0 }), 3);
	assert.equal(corazonesAMostrar({ vidaMaxima: 3, vidaExtra: 2 }), 5);
	// Los base perdidos siguen dibujándose (en gris): los extra se dibujan después de los tres.
	assert.equal(corazonesAMostrar({ vidaMaxima: 3, vidaExtra: 1 }), 4);
});

test('el cofre de vida da un corazón EXTRA y no sube los 3 de base', () => {
	assert.equal(MEJORAS_COMUNES.vida.estadistica, 'vidaExtra');
	assert.equal(MEJORAS_COMUNES.vida.cantidad, 1);
	for (const mejora of Object.values(MEJORAS_COMUNES)) {
		assert.notEqual(mejora.estadistica, 'vidaMaxima', 'ningún cofre sube los corazones base');
	}
});

test('hay un dibujo para cada clase de corazón: lleno, gris (vacío) y extra, los tres de 16 × 16', () => {
	for (const clave of ['corazon-lleno', 'corazon-vacio', 'corazon-extra']) {
		assert.equal(RECURSOS[clave].ancho, 16, clave);
		assert.equal(RECURSOS[clave].alto, 16, clave);
		assert.ok(RECURSOS[clave].formas.length > 0, clave);
	}
	// El extra se distingue de los otros dos por el color: es azul (más azul que rojo).
	const color = RECURSOS['corazon-extra'].formas[0].color;
	const rojo = (color >> 16) & 0xff;
	const azul = color & 0xff;
	assert.ok(azul > rojo, 'el corazón extra debe ser azulado');
	assert.notEqual(color, RECURSOS['corazon-lleno'].formas[0].color);
});
