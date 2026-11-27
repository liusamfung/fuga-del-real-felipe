import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PoderConRecarga } from '../src/sistemas/PoderConRecarga.js';
import { CONFIG } from '../src/config.js';
import {
	alcanzadosPorLaExplosion,
	limitarAlRectangulo,
	rectanguloDelCuerpo,
	tiempoDeVuelo,
	tramosDeRayas,
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

test('la explosión cuenta el CUERPO del objetivo: basta con que el círculo lo roce, aunque su centro quede fuera', () => {
	const centro = { x: 0, y: 0 };
	const cuerpo = { ancho: 24, alto: 40 }; // lo que mide un enemigo
	// A la derecha: el centro está a 110, pero su lado izquierdo está a 98 (110 - 12). Con radio 100 lo roza.
	const roza = { x: 110, y: 0, ...cuerpo };
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 100, [roza]), [roza]);
	// Como punto (sin cuerpo) el mismo objetivo quedaría fuera: eso es lo que arregla este cambio.
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 100, [{ x: 110, y: 0 }]), []);
	// Un cuerpo alto cuyo borde de abajo toca el círculo.
	const arriba = { x: 0, y: -118, ...cuerpo }; // su borde inferior está a 98
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 100, [arriba]), [arriba]);
	// Un poco más lejos ya no.
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 100, [{ x: 130, y: 0, ...cuerpo }]), []);
});

test('un cuerpo cuyo centro está dentro del círculo siempre cuenta, y en una esquina se mide a la esquina', () => {
	const centro = { x: 0, y: 0 };
	const encima = { x: 0, y: 0, ancho: 64, alto: 64 }; // el nido justo debajo de la explosión
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 10, [encima]), [encima]);
	// Una esquina del cuerpo a (60, 60) - (32, 32) = (28, 28) → distancia 39,6: fuera de 39, dentro de 40.
	const enLaDiagonal = { x: 60, y: 60, ancho: 64, alto: 64 };
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 39, [enLaDiagonal]), []);
	assert.deepEqual(alcanzadosPorLaExplosion(centro, 40, [enLaDiagonal]), [enLaDiagonal]);
});

test('la granada golpea a un enemigo pegado al jugador aunque la lance a sus pies', () => {
	const { RADIO } = CONFIG.PODERES.GRANADA;
	const { CUERPO_ANCHO, CUERPO_ALTO } = CONFIG.ENEMIGO;
	const jugador = { x: 500, y: 500 };
	// Un enemigo a 100 px de distancia, justo a un lado: dentro del círculo, con cuerpo o sin él.
	const pegado = { x: 600, y: 500, ancho: CUERPO_ANCHO, alto: CUERPO_ALTO };
	assert.deepEqual(alcanzadosPorLaExplosion(jugador, RADIO, [pegado]), [pegado]);
	// Y uno a RADIO + medio ancho: el centro queda fuera, pero el cuerpo roza el círculo.
	const rozando = {
		x: 500 + RADIO + CUERPO_ANCHO / 2,
		y: 500,
		ancho: CUERPO_ANCHO,
		alto: CUERPO_ALTO,
	};
	assert.deepEqual(alcanzadosPorLaExplosion(jugador, RADIO, [rozando]), [rozando]);
});

test('el radio de la granada creció: de 96 a 128 px (4 casillas)', () => {
	assert.equal(CONFIG.PODERES.GRANADA.RADIO, 128);
	assert.equal(CONFIG.PODERES.GRANADA.RADIO % CONFIG.SALA.CASILLA, 0);
});

test('rectanguloDelCuerpo convierte el cuerpo de Phaser en el objetivo de la explosión', () => {
	const cuerpo = { center: { x: 50, y: 70 }, width: 24, height: 40, otra: 'cosa' };
	assert.deepEqual(rectanguloDelCuerpo(cuerpo), { x: 50, y: 70, ancho: 24, alto: 40 });
});

// --- La vista previa ---

test('tramosDeRayas parte la línea en rayas con huecos, empezando por una raya', () => {
	const tramos = tramosDeRayas({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 10);
	assert.equal(tramos.length, 5); // rayas en 0-10, 20-30, 40-50, 60-70, 80-90
	assert.deepEqual(tramos[0], { desde: { x: 0, y: 0 }, hasta: { x: 10, y: 0 } });
	assert.deepEqual(tramos[1].desde, { x: 20, y: 0 });
	assert.deepEqual(tramos[4].hasta, { x: 90, y: 0 });
});

test('la última raya se corta donde acaba la línea: nunca pasa del destino', () => {
	const tramos = tramosDeRayas({ x: 0, y: 0 }, { x: 25, y: 0 }, 10, 10);
	assert.equal(tramos.length, 2);
	assert.deepEqual(tramos[1], { desde: { x: 20, y: 0 }, hasta: { x: 25, y: 0 } });
});

test('tramosDeRayas funciona en diagonal y las rayas siguen la dirección de la línea', () => {
	const tramos = tramosDeRayas({ x: 10, y: 10 }, { x: 10 + 30, y: 10 + 40 }, 25, 25); // largo 50
	assert.equal(tramos.length, 1);
	assert.deepEqual(tramos[0].desde, { x: 10, y: 10 });
	assert.ok(Math.abs(tramos[0].hasta.x - 25) < 1e-9 && Math.abs(tramos[0].hasta.y - 30) < 1e-9);
});

test('una línea de largo cero (lanzar a los pies) no tiene rayas', () => {
	assert.deepEqual(tramosDeRayas({ x: 5, y: 5 }, { x: 5, y: 5 }, 10, 10), []);
});

test('la vista previa tiene su configuración: color, raya y hueco', () => {
	const { COLOR, RAYA, HUECO } = CONFIG.PODERES.GRANADA.VISTA_PREVIA;
	assert.ok(Number.isInteger(COLOR));
	assert.ok(RAYA > 0 && HUECO > 0);
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
