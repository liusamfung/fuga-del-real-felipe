import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { TIPOS_DE_ENEMIGO } from '../src/datos/enemigos.js';
import { NIVEL_1, NIVEL_2, NIVELES } from '../src/datos/niveles.js';
import { FOTOGRAMAS_TILESET, FOTOGRAMAS_TILESET_2, RECURSOS } from '../src/datos/recursos.js';
import { buscarSala, generarNivel } from '../src/sistemas/GeneradorDeNivel.js';
import { rectanguloDePuerta } from '../src/utilidades/paredes.js';

// El nivel 2 (la prisión): sus salas con guardias, su tileset y que el generador lo arme como al nivel 1. La
// geometría (nadie nace en una pared, una caja o encima de otro) se comprueba para los dos niveles en
// generadorDeNivel.test.js.
const { ANCHO, ALTO, CASILLA, ANCHO_PUERTA } = CONFIG.SALA;
const MEDIDAS = { ancho: ANCHO, alto: ALTO, grosor: CASILLA, anchoPuerta: ANCHO_PUERTA };
const clave = ({ columna, fila }) => `${columna},${fila}`;
const solapan = (a, b) =>
	a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;

test('hay dos niveles y se piden por su número', () => {
	assert.equal(NIVELES[1], NIVEL_1);
	assert.equal(NIVELES[2], NIVEL_2);
	assert.deepEqual(Object.keys(NIVELES), ['1', '2']);
});

test('el nivel 2 se arma como el 1: 9 salas, 8 de combate y el jefe en el centro, con 24 puertas', () => {
	const nivel = generarNivel(NIVEL_2);
	assert.equal(nivel.nombre, 'Prisión');
	assert.equal(nivel.salas.length, 9);
	assert.equal(buscarSala(nivel, 1, 1).tipo, 'jefe');
	assert.equal(
		nivel.salas.reduce((suma, sala) => suma + sala.puertas.length, 0),
		24,
	);
	assert.notEqual(nivel.salaConLlave, undefined);
});

test('todos los enemigos del nivel 2 son guardias, entre 3 y 5 por sala, y no hay nidos', () => {
	const nivel = generarNivel(NIVEL_2);
	for (const sala of nivel.salas.filter((s) => s.tipo === 'combate')) {
		assert.ok(sala.enemigos.length >= 3 && sala.enemigos.length <= 5, `sala ${clave(sala)}`);
		assert.equal(sala.nido, null, `sala ${clave(sala)}: tiene nido`);
		for (const { tipo } of sala.enemigos) {
			assert.ok(tipo.startsWith('guardia-'), `sala ${clave(sala)}: ${tipo}`);
			assert.ok(TIPOS_DE_ENEMIGO[tipo].disparo, `${tipo} no dispara`);
		}
	}
});

test('cada sala tiene su propia mezcla de guardias, hay de los dos tipos y la inicial es la más suave', () => {
	const nivel = generarNivel(NIVEL_2);
	const combates = nivel.salas.filter((s) => s.tipo === 'combate');
	const mezcla = (sala) =>
		['guardia-azul', 'guardia-rojo']
			.map((t) => `${t}:${sala.enemigos.filter((e) => e.tipo === t).length}`)
			.join(' ');
	const mezclas = combates.map(mezcla);
	assert.equal(new Set(mezclas).size, mezclas.length, `mezclas repetidas: ${mezclas.join(' | ')}`);

	const usados = new Set(combates.flatMap((s) => s.enemigos.map((e) => e.tipo)));
	assert.deepEqual([...usados].sort(), ['guardia-azul', 'guardia-rojo']);

	const vida = (sala) =>
		sala.enemigos.reduce((suma, { tipo }) => suma + TIPOS_DE_ENEMIGO[tipo].vida, 0);
	const inicial = combates.find((s) => s.esInicial);
	for (const sala of combates) {
		assert.ok(vida(inicial) <= vida(sala), `sala ${clave(sala)} es más suave que la inicial`);
	}
});

test('las cajas del nivel 2 no bloquean las cruces por donde se va de una puerta a otra', () => {
	const mitad = ANCHO_PUERTA / 2;
	const cruces = [
		{ x: ANCHO / 2 - mitad, y: 0, ancho: ANCHO_PUERTA, alto: ALTO },
		{ x: 0, y: ALTO / 2 - mitad, ancho: ANCHO, alto: ANCHO_PUERTA },
	];
	for (const sala of NIVEL_2.salas) {
		for (const caja of sala.obstaculos) {
			for (const cruz of cruces) {
				assert.ok(!solapan(caja, cruz), `sala ${clave(sala)}: una caja bloquea una puerta`);
			}
		}
	}
	assert.ok(rectanguloDePuerta('arriba', MEDIDAS));
});

test('ningún guardia nace a tiro de una puerta: a más de 200 px, para no disparar al jugador que entra', () => {
	const nivel = generarNivel(NIVEL_2);
	for (const sala of nivel.salas.filter((s) => s.tipo === 'combate')) {
		for (const enemigo of sala.enemigos) {
			for (const { lado } of sala.puertas) {
				const hueco = rectanguloDePuerta(lado, MEDIDAS);
				const distancia = Math.hypot(
					enemigo.x - (hueco.x + hueco.ancho / 2),
					enemigo.y - (hueco.y + hueco.alto / 2),
				);
				assert.ok(
					distancia >= 200,
					`sala ${clave(sala)}: ${enemigo.tipo} a ${Math.round(distancia)} px de ${lado}`,
				);
			}
		}
	}
});

// --- El estilo (suelo y paredes) ---

test('el estilo de cada nivel apunta a una hoja que existe y a cuadros que existen en ella', () => {
	const piezas = { tileset: FOTOGRAMAS_TILESET, 'tileset-2': FOTOGRAMAS_TILESET_2 };
	for (const nivel of [NIVEL_1, NIVEL_2]) {
		const { tileset, suelo, pared } = nivel.estilo;
		assert.equal(RECURSOS[tileset].tipo, 'hoja', `${nivel.nombre}: ${tileset}`);
		const cuadros = Object.values(piezas[tileset]);
		assert.ok(
			cuadros.includes(suelo),
			`${nivel.nombre}: el suelo ${suelo} no es una pieza del tileset`,
		);
		assert.ok(
			cuadros.includes(pared),
			`${nivel.nombre}: la pared ${pared} no es una pieza del tileset`,
		);
	}
});

test('el generador entrega el estilo del nivel y los dos niveles se ven distintos', () => {
	assert.deepEqual(generarNivel(NIVEL_2).estilo, NIVEL_2.estilo);
	assert.deepEqual(generarNivel(NIVEL_1).estilo, NIVEL_1.estilo);
	assert.notEqual(NIVEL_1.estilo.tileset, NIVEL_2.estilo.tileset);
});

test('el tileset del nivel 2 no usa piezas que no tiene: solo hay 13 (0 a 12)', () => {
	const cuadros = Object.values(FOTOGRAMAS_TILESET_2);
	assert.equal(cuadros.length, 13);
	assert.equal(Math.min(...cuadros), 0);
	assert.equal(Math.max(...cuadros), 12);
	assert.equal(new Set(cuadros).size, 13, 'dos piezas con el mismo número');
});
