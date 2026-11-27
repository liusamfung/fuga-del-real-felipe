import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	desenlaceDelAtaqueFuerte,
	nivelDelAtaqueFuerte,
	PeleaConElJefe,
} from '../src/sistemas/PeleaConElJefe.js';

// Los valores acordados para el jefe 1: 30 de vida, ataque básico cada 2 s, 3 ataques fuertes (al bajar de
// 75 %, 50 % y 25 %) con retos de nivel 1, 2 y 1, y devolver el golpe quita el 10 % de la vida.
const crear = (extra = {}) =>
	new PeleaConElJefe({
		vidaMaxima: 30,
		umbrales: [0.75, 0.5, 0.25],
		intervaloDeAtaque: 2000,
		primerAtaque: 1500,
		nivelesDeInglesDeLosAtaquesFuertes: [1, 2, 1],
		devolucion: 0.1,
		rapido: 0.5,
		pausaTrasElAtaqueFuerte: 1500,
		...extra,
	});

// Un ataque básico de un solo proyectil (lo que da la pelea si no se le piden otras variantes).
const BASICO = { tipo: 'ataque-basico', patron: 'simple' };

// Una pelea ya empezada en el instante 0.
const empezada = (extra) => {
	const pelea = crear(extra);
	pelea.empezar(0);
	return pelea;
};

// --- Cómo termina un ataque fuerte ---

test('acertar rápido devuelve el golpe; acertar tarde esquiva; fallar o quedarse sin tiempo es golpe', () => {
	assert.equal(desenlaceDelAtaqueFuerte('acertada', 0.9), 'devuelto');
	assert.equal(desenlaceDelAtaqueFuerte('acertada', 0.2), 'esquivado');
	assert.equal(desenlaceDelAtaqueFuerte('fallada', 0.9), 'golpe');
	assert.equal(desenlaceDelAtaqueFuerte('tiempo-agotado', 0), 'golpe');
});

test('"rápido" es la primera mitad del tiempo: justo en la mitad todavía cuenta', () => {
	assert.equal(desenlaceDelAtaqueFuerte('acertada', 0.5), 'devuelto');
	assert.equal(desenlaceDelAtaqueFuerte('acertada', 0.4999), 'esquivado');
	assert.equal(
		desenlaceDelAtaqueFuerte('acertada', 0.4, 0.4),
		'devuelto',
		'el umbral se puede cambiar',
	);
});

test('fallar es golpe aunque se hubiera respondido a tiempo: el resultado manda, no la rapidez', () => {
	assert.equal(desenlaceDelAtaqueFuerte('fallada', 1), 'golpe');
});

test('los niveles de los ataques fuertes se alternan y la secuencia se repite si se acaba', () => {
	const secuencia = [1, 2, 1];
	assert.deepEqual(
		[0, 1, 2, 3, 4, 5].map((n) => nivelDelAtaqueFuerte(secuencia, n)),
		[1, 2, 1, 1, 2, 1],
	);
	assert.equal(nivelDelAtaqueFuerte([2, 3], 5), 3);
});

// --- Antes y después de la pelea ---

test('antes de empezar, el jefe no ataca y no recibe daño', () => {
	const pelea = crear();
	assert.equal(pelea.estado, 'esperando');
	assert.deepEqual(pelea.actualizar(99999), []);
	assert.deepEqual(pelea.recibirDano(5), { aplicado: 0, derrotado: false });
	assert.equal(pelea.vida, 30);
	assert.equal(pelea.vulnerable, false);
});

test('empezar solo funciona la primera vez: no reinicia el reloj de los ataques', () => {
	const pelea = crear();
	pelea.empezar(1000);
	pelea.empezar(9000);
	assert.equal(pelea.proximoAtaque, 1000 + 1500);
});

// --- Ataques básicos ---

test('el primer ataque básico llega a los 1,5 s y luego uno cada 2 s', () => {
	const pelea = empezada();
	assert.deepEqual(pelea.actualizar(1499), []);
	assert.deepEqual(pelea.actualizar(1500), [BASICO]);
	assert.deepEqual(pelea.actualizar(3499), [], 'no antes de 2 s después');
	assert.deepEqual(pelea.actualizar(3500), [BASICO]);
	assert.deepEqual(pelea.actualizar(5500), [BASICO]);
});

test('llamar varias veces en el mismo instante no lanza dos ataques', () => {
	const pelea = empezada();
	assert.equal(pelea.actualizar(1500).length, 1);
	assert.equal(pelea.actualizar(1500).length, 0);
	assert.equal(pelea.actualizar(1501).length, 0);
});

// --- Daño y umbrales ---

test('recibir daño le baja la vida, y nunca queda en negativo', () => {
	const pelea = empezada();
	assert.deepEqual(pelea.recibirDano(1), { aplicado: 1, derrotado: false });
	assert.equal(pelea.vida, 29);
	assert.equal(pelea.fraccionDeVida, 29 / 30);
	assert.deepEqual(pelea.recibirDano(0), { aplicado: 0, derrotado: false });
	assert.deepEqual(pelea.recibirDano(-3), { aplicado: 0, derrotado: false });
	assert.equal(pelea.vida, 29);
});

test('no hay ataque fuerte mientras la vida esté por encima del primer umbral (75 % = 22,5)', () => {
	const pelea = empezada();
	pelea.recibirDano(7); // 23: todavía por encima
	assert.equal(pelea.vida, 23);
	assert.deepEqual(pelea.actualizar(0), []);
});

test('al bajar de 75 % viene el primer ataque fuerte, con el reto de nivel 1', () => {
	const pelea = empezada();
	pelea.recibirDano(8); // 22: ya está por debajo de 22,5
	assert.deepEqual(pelea.actualizar(0), [{ tipo: 'ataque-fuerte', nivel: 1 }]);
	assert.equal(pelea.estado, 'ataque-fuerte');
});

test('un ataque fuerte tiene prioridad sobre un ataque básico que toca a la vez', () => {
	const pelea = empezada();
	pelea.recibirDano(8);
	assert.deepEqual(pelea.actualizar(5000), [{ tipo: 'ataque-fuerte', nivel: 1 }], 'solo el fuerte');
});

test('mientras dura el ataque fuerte el jefe no lanza ataques básicos ni otro ataque fuerte', () => {
	const pelea = empezada();
	pelea.recibirDano(8);
	pelea.actualizar(0);
	assert.deepEqual(pelea.actualizar(2000), []);
	assert.deepEqual(pelea.actualizar(60000), []);
	pelea.recibirDano(10); // aunque baje de otro umbral mientras tanto
	assert.deepEqual(pelea.actualizar(60001), []);
});

test('los tres ataques fuertes: a 75 %, 50 % y 25 %, con los niveles 1, 2 y 1, cada uno una sola vez', () => {
	const pelea = empezada();
	const niveles = [];
	let ahora = 0;
	for (const vidaObjetivo of [22, 15, 7]) {
		pelea.recibirDano(pelea.vida - vidaObjetivo);
		ahora += 3000;
		const acciones = pelea.actualizar(ahora);
		assert.equal(acciones.length, 1, `a ${vidaObjetivo} de vida`);
		assert.equal(acciones[0].tipo, 'ataque-fuerte');
		niveles.push(acciones[0].nivel);
		assert.ok(pelea.terminarAtaqueFuerte('acertada', 0.1, ahora));
		// con la misma vida no vuelve a venir el mismo ataque fuerte
		assert.ok(pelea.actualizar(ahora + 100000).every((a) => a.tipo !== 'ataque-fuerte'));
	}
	assert.deepEqual(niveles, [1, 2, 1]);
	assert.equal(pelea.ataquesFuertesIniciados, 3);
});

test('después del tercer ataque fuerte no hay más, por poca vida que le quede', () => {
	const pelea = empezada();
	pelea.recibirDano(26); // 4 de vida: por debajo de los tres umbrales
	for (let i = 0; i < 3; i += 1) {
		const ahora = 10000 * (i + 1);
		assert.equal(pelea.actualizar(ahora)[0].tipo, 'ataque-fuerte');
		pelea.terminarAtaqueFuerte('acertada', 0.1, ahora);
	}
	for (const ahora of [100000, 200000, 300000]) {
		assert.ok(pelea.actualizar(ahora).every((a) => a.tipo !== 'ataque-fuerte'));
	}
});

test('un golpe grande que cruza varios umbrales de una vez da los ataques fuertes UNO TRAS OTRO', () => {
	const pelea = empezada();
	pelea.recibirDano(26); // de 30 a 4: cruza 75 %, 50 % y 25 % a la vez
	assert.deepEqual(pelea.actualizar(0), [{ tipo: 'ataque-fuerte', nivel: 1 }]);
	assert.deepEqual(pelea.actualizar(1), [], 'el segundo no empieza mientras dura el primero');
	pelea.terminarAtaqueFuerte('acertada', 0.1, 5000);
	assert.deepEqual(pelea.actualizar(5001), [], 'tras el primero hay un respiro');
	assert.deepEqual(
		pelea.actualizar(6500),
		[{ tipo: 'ataque-fuerte', nivel: 2 }],
		'y viene el segundo',
	);
});

test('si el jugador está en otro reto (libre = false), el ataque fuerte espera; el básico no', () => {
	const pelea = empezada();
	pelea.recibirDano(8);
	assert.deepEqual(pelea.actualizar(1500, { libre: false }), [BASICO]);
	assert.equal(pelea.estado, 'peleando');
	assert.deepEqual(pelea.actualizar(1600, { libre: true }), [{ tipo: 'ataque-fuerte', nivel: 1 }]);
});

// --- Terminar el ataque fuerte ---

test('esquivado: el jefe no pierde vida y la pelea sigue con un respiro de 1,5 s', () => {
	const pelea = empezada();
	pelea.recibirDano(8);
	pelea.actualizar(0);
	const resultado = pelea.terminarAtaqueFuerte('acertada', 0.2, 10000);
	assert.deepEqual(resultado, { desenlace: 'esquivado', danoAlJefe: 0, derrotado: false });
	assert.equal(pelea.vida, 22);
	assert.equal(pelea.estado, 'peleando');
	assert.deepEqual(pelea.actualizar(11499), [], 'todavía en el respiro');
	assert.deepEqual(pelea.actualizar(11500), [BASICO]);
});

test('devuelto: el jefe pierde el 10 % de su vida máxima (3 de 30)', () => {
	const pelea = empezada();
	pelea.recibirDano(8);
	pelea.actualizar(0);
	const resultado = pelea.terminarAtaqueFuerte('acertada', 0.9, 10000);
	assert.deepEqual(resultado, { desenlace: 'devuelto', danoAlJefe: 3, derrotado: false });
	assert.equal(pelea.vida, 19);
});

test('golpe: el jefe no pierde vida (el daño al jugador lo aplica quien usa la pelea)', () => {
	for (const [resultado, fraccion] of [
		['fallada', 0.8],
		['tiempo-agotado', 0],
	]) {
		const p = empezada();
		p.recibirDano(8);
		p.actualizar(0);
		assert.deepEqual(p.terminarAtaqueFuerte(resultado, fraccion, 10000), {
			desenlace: 'golpe',
			danoAlJefe: 0,
			derrotado: false,
		});
		assert.equal(p.vida, 22);
	}
});

test('devolver el golpe puede derrotar al jefe, y solo se le quita la vida que le quedaba', () => {
	const pelea = empezada();
	pelea.recibirDano(28); // quedan 2
	pelea.actualizar(0);
	const resultado = pelea.terminarAtaqueFuerte('acertada', 0.9, 10000);
	assert.deepEqual(resultado, { desenlace: 'devuelto', danoAlJefe: 2, derrotado: true });
	assert.equal(pelea.vida, 0);
	assert.equal(pelea.derrotado, true);
});

test('terminar un ataque fuerte que no existe no hace nada', () => {
	const pelea = empezada();
	assert.equal(pelea.terminarAtaqueFuerte('acertada', 0.9, 0), null);
	assert.equal(pelea.vida, 30);
});

// --- Derrota ---

test('derrotado: ya no ataca, no recibe más daño y un ataque fuerte pendiente se descarta', () => {
	const pelea = empezada();
	pelea.recibirDano(8);
	pelea.actualizar(0); // ataque fuerte en curso
	assert.deepEqual(
		pelea.recibirDano(100),
		{ aplicado: 22, derrotado: true },
		'se le puede dañar durante el reto',
	);
	assert.equal(pelea.estado, 'derrotado');
	assert.deepEqual(pelea.actualizar(99999), []);
	assert.deepEqual(pelea.recibirDano(5), { aplicado: 0, derrotado: false });
	assert.equal(
		pelea.terminarAtaqueFuerte('fallada', 0, 1000),
		null,
		'el reto que quedaba abierto ya no importa',
	);
});

test('el daño no puede dejar la vida en negativo', () => {
	const pelea = empezada();
	pelea.recibirDano(1000);
	assert.equal(pelea.vida, 0);
	assert.equal(pelea.fraccionDeVida, 0);
});

// --- Los valores del jefe en la configuración ---

test('la configuración del jefe es coherente y se puede armar una pelea con ella', async () => {
	const { CONFIG } = await import('../src/config.js');
	const { JEFE } = CONFIG;

	assert.ok(Number.isInteger(JEFE.VIDA) && JEFE.VIDA > 0);
	assert.ok(JEFE.UMBRALES.length >= 1);
	for (const umbral of JEFE.UMBRALES) {
		assert.ok(umbral > 0 && umbral < 1, `el umbral ${umbral} debe estar entre 0 y 1`);
	}
	assert.deepEqual(
		[...JEFE.UMBRALES],
		[...JEFE.UMBRALES].sort((a, b) => b - a),
		'de mayor a menor',
	);
	for (const nivel of JEFE.NIVELES_DE_INGLES) {
		assert.ok(
			[1, 2, 3].includes(nivel),
			`el nivel ${nivel}: los ataques fuertes usan los retos 1 (traducción), 2 (definición) o 3 (dictado)`,
		);
	}
	// Desde el 27/11/2026 el ataque básico es rápido y frecuente (lo pidió el usuario), pero con un tope: dos por segundo ya no se esquivarían.
	assert.ok(JEFE.INTERVALO_DE_ATAQUE >= 500, 'más de dos ataques por segundo sería una avalancha');
	assert.ok(JEFE.AVISO > 0 && JEFE.PAUSA_TRAS_EL_ATAQUE_FUERTE > 0);
	assert.ok(JEFE.RAPIDO > 0 && JEFE.RAPIDO < 1);
	assert.ok(JEFE.DEVOLUCION > 0 && JEFE.DEVOLUCION < 1);
	// Un golpe fallado no debe matar de golpe al jugador que empieza con 3 corazones: le quita menos de su vida inicial.
	assert.ok(JEFE.DANO_DEL_GOLPE >= 1 && JEFE.DANO_DEL_GOLPE < CONFIG.JUGADOR.VIDA_INICIAL);
	// Los proyectiles son más rápidos que el jugador (no se les gana corriendo: se esquivan de lado), pero cruzar la
	// sala (800 px) les toma al menos un segundo.
	assert.ok(JEFE.PROYECTIL.VELOCIDAD > CONFIG.JUGADOR.VELOCIDAD);
	assert.ok(JEFE.PROYECTIL.VELOCIDAD <= CONFIG.SALA.ANCHO);

	const pelea = new PeleaConElJefe({
		vidaMaxima: JEFE.VIDA,
		umbrales: JEFE.UMBRALES,
		intervaloDeAtaque: JEFE.INTERVALO_DE_ATAQUE,
		primerAtaque: JEFE.PRIMER_ATAQUE,
		nivelesDeInglesDeLosAtaquesFuertes: JEFE.NIVELES_DE_INGLES,
		devolucion: JEFE.DEVOLUCION,
		rapido: JEFE.RAPIDO,
		pausaTrasElAtaqueFuerte: JEFE.PAUSA_TRAS_EL_ATAQUE_FUERTE,
	});
	pelea.empezar(0);
	assert.equal(
		pelea.vida,
		60,
		'el jefe empieza con 60 de vida (30 acordado el 26/11, duplicado el 27/11)',
	);
	assert.equal(JEFE.UMBRALES.length, 3, 'tres ataques fuertes por pelea (lo acordado)');
});

test('con la vida del jefe y los valores acordados, el 10 % que se devuelve son 6 puntos', async () => {
	const { CONFIG } = await import('../src/config.js');
	assert.equal(Math.round(CONFIG.JEFE.VIDA * CONFIG.JEFE.DEVOLUCION), 6);
});
