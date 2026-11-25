import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { NIVEL_1 } from '../src/datos/niveles.js';
import { buscarSala, generarNivel } from '../src/sistemas/GeneradorDeNivel.js';
import { ladoOpuesto, rectanguloDePuerta } from '../src/utilidades/paredes.js';

const { ANCHO, ALTO, CASILLA, ANCHO_PUERTA } = CONFIG.SALA;
const MEDIDAS = { ancho: ANCHO, alto: ALTO, grosor: CASILLA, anchoPuerta: ANCHO_PUERTA };

// Generador de números al azar con semilla (mulberry32): da siempre la misma secuencia, así las
// pruebas no fallan "a veces".
function azarConSemilla(semilla) {
	let estado = semilla;
	return () => {
		estado = (estado + 0x6d2b79f5) | 0;
		let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const clave = ({ columna, fila }) => `${columna},${fila}`;
const solapan = (a, b) =>
	a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;

test('el nivel tiene 9 salas: 8 de combate alrededor y la del jefe en el centro', () => {
	const nivel = generarNivel(NIVEL_1);

	assert.equal(nivel.salas.length, 9);
	assert.equal(nivel.salas.filter((sala) => sala.tipo === 'combate').length, 8);
	assert.equal(buscarSala(nivel, 1, 1).tipo, 'jefe');
});

test('cada sala de alrededor tiene un enemigo y un cofre; la del jefe no tiene ninguno', () => {
	const nivel = generarNivel(NIVEL_1);

	for (const sala of nivel.salas) {
		if (sala.tipo === 'jefe') {
			assert.equal(sala.enemigos.length, 0);
			assert.equal(sala.cofre, null);
		} else {
			assert.equal(sala.enemigos.length, 1, `sala ${clave(sala)}`);
			assert.notEqual(sala.cofre, null, `sala ${clave(sala)}`);
		}
	}
});

test('la llave está siempre en exactamente un cofre, y nunca en la sala del jefe (3000 niveles)', () => {
	const azar = azarConSemilla(1);

	for (let i = 0; i < 3000; i += 1) {
		const nivel = generarNivel(NIVEL_1, azar);
		const conLlave = nivel.salas.filter((sala) => sala.cofre?.conLlave);

		assert.equal(conLlave.length, 1);
		assert.equal(conLlave[0].tipo, 'combate');
		assert.deepEqual(nivel.salaConLlave, { columna: conLlave[0].columna, fila: conLlave[0].fila });
	}
});

test('cada cofre tiene 1/8 de probabilidad de tener la llave', () => {
	const azar = azarConSemilla(2);
	const veces = new Map();
	const niveles = 16000;

	for (let i = 0; i < niveles; i += 1) {
		const clavDeLaSala = clave(generarNivel(NIVEL_1, azar).salaConLlave);
		veces.set(clavDeLaSala, (veces.get(clavDeLaSala) ?? 0) + 1);
	}

	assert.equal(veces.size, 8, 'las 8 salas deben poder tener la llave');
	for (const [sala, cantidad] of veces) {
		const proporcion = cantidad / niveles;
		assert.ok(
			Math.abs(proporcion - 1 / 8) < 0.02,
			`sala ${sala}: ${(proporcion * 100).toFixed(1)} % (se esperaba 12,5 %)`,
		);
	}
});

test('con el azar fijo en los extremos, la llave cae en la primera y en la última sala', () => {
	assert.deepEqual(generarNivel(NIVEL_1, () => 0).salaConLlave, { columna: 0, fila: 0 });
	assert.deepEqual(generarNivel(NIVEL_1, () => 0.999999).salaConLlave, { columna: 2, fila: 2 });
});

test('hay 12 conexiones (24 puertas) y cada puerta tiene su pareja en la sala vecina', () => {
	const nivel = generarNivel(NIVEL_1);
	const total = nivel.salas.reduce((suma, sala) => suma + sala.puertas.length, 0);
	assert.equal(total, 24);

	for (const sala of nivel.salas) {
		for (const puerta of sala.puertas) {
			const vecina = buscarSala(nivel, puerta.hacia.columna, puerta.hacia.fila);
			const pareja = vecina.puertas.find((p) => p.lado === ladoOpuesto(puerta.lado));

			assert.ok(pareja, `la puerta ${puerta.lado} de ${clave(sala)} no tiene pareja`);
			assert.deepEqual(pareja.hacia, { columna: sala.columna, fila: sala.fila });
			assert.equal(pareja.bloqueadaPorLlave, puerta.bloqueadaPorLlave);
		}
	}
});

test('solo las puertas que tocan la sala del jefe se abren con llave (8 de las 24)', () => {
	const nivel = generarNivel(NIVEL_1);
	const conLlave = nivel.salas.flatMap((sala) =>
		sala.puertas
			.filter((puerta) => puerta.bloqueadaPorLlave)
			.map((puerta) => ({ desde: clave(sala), hacia: clave(puerta.hacia) })),
	);

	assert.equal(conLlave.length, 8);
	for (const { desde, hacia } of conLlave) {
		assert.ok(desde === '1,1' || hacia === '1,1', `${desde} -> ${hacia} no toca la sala del jefe`);
	}
});

test('sin la llave se llega a las 8 salas de alrededor pero no al jefe; con la llave, a todas', () => {
	const nivel = generarNivel(NIVEL_1);

	function alcanzables(puedeAbrirConLlave) {
		const visitadas = new Set([clave(nivel.salaInicial)]);
		const porVisitar = [nivel.salaInicial];
		while (porVisitar.length > 0) {
			const actual = porVisitar.pop();
			for (const puerta of buscarSala(nivel, actual.columna, actual.fila).puertas) {
				if (puerta.bloqueadaPorLlave && !puedeAbrirConLlave) {
					continue;
				}
				if (!visitadas.has(clave(puerta.hacia))) {
					visitadas.add(clave(puerta.hacia));
					porVisitar.push(puerta.hacia);
				}
			}
		}
		return visitadas;
	}

	const sinLlave = alcanzables(false);
	assert.equal(sinLlave.size, 8);
	assert.ok(!sinLlave.has('1,1'));
	assert.equal(alcanzables(true).size, 9);
});

test('ningún enemigo ni cofre toca un obstáculo o una pared, y los enemigos nacen lejos de las puertas', () => {
	const interior = { x: CASILLA, y: CASILLA, ancho: ANCHO - 2 * CASILLA, alto: ALTO - 2 * CASILLA };
	const dentro = (r) =>
		r.x >= interior.x &&
		r.y >= interior.y &&
		r.x + r.ancho <= interior.x + interior.ancho &&
		r.y + r.alto <= interior.y + interior.alto;
	const nivel = generarNivel(NIVEL_1);

	for (const sala of nivel.salas.filter((s) => s.tipo === 'combate')) {
		const nombre = `sala ${clave(sala)}`;
		const enemigo = sala.enemigos[0];
		const cuerpoDelEnemigo = { x: enemigo.x - 16, y: enemigo.y - 24, ancho: 32, alto: 48 };
		const cuerpoDelCofre = { x: sala.cofre.x - 16, y: sala.cofre.y - 16, ancho: 32, alto: 32 };

		assert.ok(dentro(cuerpoDelEnemigo), `${nombre}: el enemigo nace dentro de una pared`);
		assert.ok(dentro(cuerpoDelCofre), `${nombre}: el cofre sale dentro de una pared`);
		for (const obstaculo of sala.obstaculos) {
			assert.ok(dentro(obstaculo), `${nombre}: un obstáculo toca una pared`);
			assert.ok(
				!solapan(obstaculo, cuerpoDelEnemigo),
				`${nombre}: el enemigo nace en un obstáculo`,
			);
			assert.ok(!solapan(obstaculo, cuerpoDelCofre), `${nombre}: el cofre sale en un obstáculo`);
		}

		// El jugador entra por una puerta: el enemigo no debe nacer cerca de ninguna.
		for (const { lado } of sala.puertas) {
			const hueco = rectanguloDePuerta(lado, MEDIDAS);
			const distancia = Math.hypot(
				enemigo.x - (hueco.x + hueco.ancho / 2),
				enemigo.y - (hueco.y + hueco.alto / 2),
			);
			assert.ok(
				distancia >= 200,
				`${nombre}: el enemigo nace a ${Math.round(distancia)} px de la puerta ${lado}`,
			);
		}
	}
});

test('los obstáculos dejan libres las cruces por donde se va de una puerta a otra', () => {
	const mitadPuerta = ANCHO_PUERTA / 2;
	const crucesLibres = [
		{ x: ANCHO / 2 - mitadPuerta, y: 0, ancho: ANCHO_PUERTA, alto: ALTO }, // de arriba a abajo
		{ x: 0, y: ALTO / 2 - mitadPuerta, ancho: ANCHO, alto: ANCHO_PUERTA }, // de izquierda a derecha
	];

	for (const sala of NIVEL_1.salas) {
		for (const obstaculo of sala.obstaculos) {
			for (const cruz of crucesLibres) {
				assert.ok(
					!solapan(obstaculo, cruz),
					`sala ${clave(sala)}: un obstáculo bloquea una puerta`,
				);
			}
		}
	}
});

test('una descripción a la que le falta una sala da un error que dice cuál', () => {
	const incompleta = { ...NIVEL_1, salas: NIVEL_1.salas.slice(1) };

	assert.throws(() => generarNivel(incompleta), /Falta describir la sala 0,0/);
});
