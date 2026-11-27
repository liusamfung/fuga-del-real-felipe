import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import {
	disparosDeLaRafaga,
	elegirElPatronBasico,
	PeleaConElJefe,
} from '../src/sistemas/PeleaConElJefe.js';
import { direccionesDelAbanico } from '../src/utilidades/abanico.js';

// Los ataques básicos del jefe (27/11/2026): un proyectil, tres a la vez en abanico, o una ráfaga. Aquí se prueba
// qué patrón toca (con la tirada al azar puesta a mano), cuántos disparos tiene una ráfaga y cómo se reparte el
// abanico. Todo es lógica pura.
const PROBABILIDADES = { probabilidadDeTriple: 0.35, probabilidadMaximaDeRafaga: 0.4 };
const patron = (fraccion, tirada) => elegirElPatronBasico(fraccion, tirada, PROBABILIDADES);

test('con toda la vida nunca hay ráfaga: solo triple (los primeros 35 %) o simple', () => {
	assert.equal(patron(1, 0), 'triple');
	assert.equal(patron(1, 0.349), 'triple');
	assert.equal(patron(1, 0.35), 'simple', 'el borde pertenece al siguiente tramo');
	assert.equal(patron(1, 0.99), 'simple');
});

test('sin vida la ráfaga ocupa el primer 40 %, luego el triple 35 % y el resto es simple', () => {
	assert.equal(patron(0, 0), 'rafaga');
	assert.equal(patron(0, 0.399), 'rafaga');
	assert.equal(patron(0, 0.4), 'triple');
	assert.equal(patron(0, 0.749), 'triple');
	assert.equal(patron(0, 0.75), 'simple');
});

test('con la mitad de la vida la ráfaga ocupa el primer 20 %', () => {
	assert.equal(patron(0.5, 0.199), 'rafaga');
	assert.equal(patron(0.5, 0.2), 'triple');
	assert.equal(patron(0.5, 0.549), 'triple');
	assert.equal(patron(0.5, 0.55), 'simple');
});

test('cuanta menos vida, más probable la ráfaga (y nunca baja al perder vida)', () => {
	let anterior = -1;
	for (const fraccion of [1, 0.9, 0.75, 0.5, 0.25, 0.1, 0]) {
		let rafagas = 0;
		for (let tirada = 0; tirada < 1; tirada += 0.001) {
			rafagas += patron(fraccion, tirada) === 'rafaga' ? 1 : 0;
		}
		assert.ok(rafagas >= anterior, `con ${fraccion} de vida hay menos ráfagas que con más vida`);
		anterior = rafagas;
	}
	assert.ok(anterior > 350, 'sin vida son ~40 % de las tiradas');
});

test('una fracción de vida fuera de 0 a 1 se trata como el extremo más cercano', () => {
	assert.equal(patron(1.5, 0.1), patron(1, 0.1));
	assert.equal(patron(-1, 0.1), patron(0, 0.1));
});

test('sin probabilidades (lo normal en las pruebas) el ataque es siempre simple', () => {
	const sin = { probabilidadDeTriple: 0, probabilidadMaximaDeRafaga: 0 };
	for (const fraccion of [1, 0.5, 0]) {
		for (const tirada of [0, 0.3, 0.99]) {
			assert.equal(elegirElPatronBasico(fraccion, tirada, sin), 'simple');
		}
	}
});

test('una ráfaga tiene más disparos cuanta menos vida le queda al jefe', () => {
	assert.equal(disparosDeLaRafaga(1, 4, 4), 4);
	assert.equal(disparosDeLaRafaga(0.5, 4, 4), 6);
	assert.equal(disparosDeLaRafaga(0, 4, 4), 8);
	assert.equal(disparosDeLaRafaga(2, 4, 4), 4, 'fuera de rango: el extremo');
	assert.equal(disparosDeLaRafaga(-1, 4, 4), 8);
});

// La pelea con el azar puesto a mano.
const pelea = (tiradas, extra = {}) => {
	let siguiente = 0;
	const p = new PeleaConElJefe({
		vidaMaxima: 60,
		umbrales: [],
		intervaloDeAtaque: 900,
		primerAtaque: 1000,
		nivelesDeInglesDeLosAtaquesFuertes: [1],
		devolucion: 0.1,
		pausaTrasElAtaqueFuerte: 1500,
		...PROBABILIDADES,
		disparosBaseDeLaRafaga: 4,
		disparosExtraDeLaRafaga: 4,
		msEntreDisparosDeLaRafaga: 110,
		azar: () => tiradas[siguiente++ % tiradas.length],
		...extra,
	});
	p.empezar(0);
	return p;
};

test('la pelea devuelve el patrón elegido: simple, triple o ráfaga con su número de disparos', () => {
	const simple = pelea([0.9]);
	assert.deepEqual(simple.actualizar(1000), [{ tipo: 'ataque-basico', patron: 'simple' }]);

	const triple = pelea([0.1]);
	assert.deepEqual(triple.actualizar(1000), [{ tipo: 'ataque-basico', patron: 'triple' }]);

	const rafaga = pelea([0.0]);
	rafaga.vida = 30; // la mitad: ráfaga de 6 disparos
	assert.deepEqual(rafaga.actualizar(1000), [
		{ tipo: 'ataque-basico', patron: 'rafaga', disparos: 6 },
	]);
});

test('después de una ráfaga el siguiente ataque espera a que termine y luego su intervalo', () => {
	const p = pelea([0.0]);
	p.vida = 30; // 6 disparos: duran 5 × 110 = 550 ms
	p.actualizar(1000);

	assert.equal(p.proximoAtaque, 1000 + 550 + 900);
	assert.deepEqual(p.actualizar(2449), [], 'todavía no');
	assert.equal(p.actualizar(2450).length, 1);
});

test('después de un triple o un simple el siguiente ataque llega a los 900 ms', () => {
	const p = pelea([0.1]);
	p.actualizar(1000);
	assert.equal(p.proximoAtaque, 1900);
});

test('se tira el azar una sola vez por ataque, no en cada fotograma', () => {
	let tiradas = 0;
	const p = pelea([0.9], { azar: () => ((tiradas += 1), 0.9) });
	for (let ahora = 0; ahora < 1000; ahora += 16) {
		p.actualizar(ahora); // antes del primer ataque: no hay nada que decidir
	}
	assert.equal(tiradas, 0);

	p.actualizar(1000);
	assert.equal(tiradas, 1);
});

test('con un azar parejo, el triple sale en ~35 % de los ataques y no hay ráfagas con toda la vida', () => {
	// Un generador sencillo con semilla: así la prueba da siempre lo mismo.
	let estado = 12345;
	const azarConSemilla = () => {
		estado = (estado * 1664525 + 1013904223) % 4294967296;
		return estado / 4294967296;
	};

	const contar = (vida) => {
		const p = pelea([0], { azar: azarConSemilla });
		const cuenta = { simple: 0, triple: 0, rafaga: 0 };
		for (let i = 0; i < 4000; i += 1) {
			p.vida = vida;
			p.proximoAtaque = 0;
			const [accion] = p.actualizar(10_000);
			cuenta[accion.patron] += 1;
		}
		return cuenta;
	};

	const lleno = contar(60);
	assert.equal(lleno.rafaga, 0);
	assert.ok(Math.abs(lleno.triple / 4000 - 0.35) < 0.03, `triple: ${lleno.triple / 4000}`);

	const casiMuerto = contar(6); // 10 % de la vida: ráfagas en 0,4 × 0,9 = 36 %
	assert.ok(
		Math.abs(casiMuerto.rafaga / 4000 - 0.36) < 0.03,
		`ráfaga: ${casiMuerto.rafaga / 4000}`,
	);
	assert.ok(casiMuerto.rafaga > 10 * (lleno.rafaga + 1), 'muchas más ráfagas que con toda la vida');
});

test('un ataque fuerte pendiente tiene prioridad sobre cualquier ataque básico, también una ráfaga', () => {
	const p = pelea([0.0], { umbrales: [0.5] });
	p.vida = 30; // justo en el umbral
	const [accion] = p.actualizar(1000);
	assert.equal(accion.tipo, 'ataque-fuerte');
});

// El abanico.
const largo = (v) => Math.hypot(v.x, v.y);
const grados = (a, b) => (Math.acos(a.x * b.x + a.y * b.y) * 180) / Math.PI;

test('un abanico de 3: el del medio va justo hacia el objetivo y los lados se abren 22° a cada lado', () => {
	const hacia = { x: 1, y: 0 };
	const [izquierda, centro, derecha] = direccionesDelAbanico(hacia, 3, 22);

	assert.ok(Math.abs(centro.x - 1) < 1e-12 && Math.abs(centro.y) < 1e-12);
	assert.ok(Math.abs(grados(izquierda, centro) - 22) < 1e-9);
	assert.ok(Math.abs(grados(derecha, centro) - 22) < 1e-9);
	assert.ok(Math.abs(grados(izquierda, derecha) - 44) < 1e-9);
	// Uno va hacia arriba de la pantalla y el otro hacia abajo: los lados son simétricos.
	assert.ok(Math.abs(izquierda.y + derecha.y) < 1e-12);
	assert.ok(izquierda.y * derecha.y < 0, 'cada uno a un lado distinto');
});

test('todas las direcciones del abanico tienen largo 1, también en diagonal y hacia cualquier lado', () => {
	for (const hacia of [
		{ x: 0, y: 1 },
		{ x: -1, y: 0 },
		{ x: Math.SQRT1_2, y: -Math.SQRT1_2 },
	]) {
		for (const direccion of direccionesDelAbanico(hacia, 5, 15)) {
			assert.ok(Math.abs(largo(direccion) - 1) < 1e-12);
		}
	}
});

test('un abanico de 1 es la dirección misma; de 2 se reparte mitad y mitad; de 0 no hay nada', () => {
	const hacia = { x: 0, y: 1 };
	const [uno] = direccionesDelAbanico(hacia, 1, 30);
	assert.ok(Math.abs(uno.x) < 1e-12 && Math.abs(uno.y - 1) < 1e-12);

	const [a, b] = direccionesDelAbanico(hacia, 2, 30);
	assert.ok(Math.abs(grados(a, hacia) - 15) < 1e-9);
	assert.ok(Math.abs(grados(b, hacia) - 15) < 1e-9);

	assert.deepEqual(direccionesDelAbanico(hacia, 0, 30), []);
});

test('el abanico apunta hacia el objetivo aunque este esté en cualquier dirección: el del medio coincide', () => {
	for (let grado = 0; grado < 360; grado += 30) {
		const hacia = { x: Math.cos((grado * Math.PI) / 180), y: Math.sin((grado * Math.PI) / 180) };
		const centro = direccionesDelAbanico(hacia, 3, 22)[1];
		assert.ok(Math.abs(centro.x - hacia.x) < 1e-12 && Math.abs(centro.y - hacia.y) < 1e-12);
	}
});

// La configuración.
test('la configuración de las variantes es coherente', () => {
	const { JEFE } = CONFIG;
	assert.equal(JEFE.VIDA, 60, 'el 27/11/2026 se duplicó la vida del jefe (era 30)');
	assert.ok(
		JEFE.TRIPLE.PROBABILIDAD + JEFE.RAFAGA.PROBABILIDAD_MAXIMA <= 1,
		'las dos no pueden pasar de 100 %',
	);
	assert.ok(
		JEFE.TRIPLE.PROBABILIDAD >= 0.25,
		'el triple sale «con mucha frecuencia» (pedido el 27/11/2026)',
	);
	assert.ok(JEFE.TRIPLE.APERTURA >= 10 && JEFE.TRIPLE.APERTURA <= 45, 'abierto, pero no al azar');
	assert.ok(JEFE.RAFAGA.DISPAROS_BASE >= 2);
	assert.ok(JEFE.RAFAGA.ENTRE_DISPAROS > 0);
	// Una ráfaga entera y un triple caben a la vez en el grupo de proyectiles.
	assert.ok(JEFE.PROYECTIL.MAX >= JEFE.RAFAGA.DISPAROS_BASE + JEFE.RAFAGA.DISPAROS_EXTRA + 3);
});
