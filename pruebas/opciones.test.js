import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FICHAS_DE_PRUEBA } from '../src/datos/fichasDePrueba.js';
import {
	distanciaDeEdicion,
	elegirOpcion,
	opcionesDistintas,
	toleranciaPara,
} from '../src/utilidades/opciones.js';

const OPCIONES = ['danger', 'party', 'river'];

// --- Distancia de edición ---

test('distanciaDeEdicion cuenta letras puestas, quitadas y cambiadas', () => {
	assert.equal(distanciaDeEdicion('danger', 'danger'), 0);
	assert.equal(distanciaDeEdicion('danger', 'dancer'), 1); // cambiada
	assert.equal(distanciaDeEdicion('run', 'rune'), 1); // puesta
	assert.equal(distanciaDeEdicion('dog', 'do'), 1); // quitada
	assert.equal(distanciaDeEdicion('', 'abc'), 3);
	assert.equal(distanciaDeEdicion('kitten', 'sitting'), 3);
});

test('toleranciaPara: una edición por cada 3 letras, y nunca menos de una', () => {
	assert.equal(toleranciaPara('run'), 1);
	assert.equal(toleranciaPara('house'), 1);
	assert.equal(toleranciaPara('danger'), 2);
	assert.equal(toleranciaPara('breakfast'), 3);
	assert.equal(toleranciaPara('danger', 2), 3);
});

// --- Elegir la opción ---

test('una palabra exacta elige su opción, sin importar mayúsculas ni signos', () => {
	const resultado = elegirOpcion(['Danger.'], OPCIONES);
	assert.equal(resultado.indice, 0);
	assert.equal(resultado.opcion, 'danger');
	assert.equal(resultado.exacta, true);
	assert.equal(resultado.distancia, 0);
});

test('el acento cambia una letra ("dancer" por "danger") y se elige igual', () => {
	const resultado = elegirOpcion(['dancer'], OPCIONES);
	assert.equal(resultado.indice, 0);
	assert.equal(resultado.exacta, false);
	assert.equal(resultado.distancia, 1);
});

test('vale cualquiera de las alternativas que dio el navegador', () => {
	assert.equal(elegirOpcion(['the very', 'party', 'parties'], OPCIONES).indice, 1);
});

test('vale la palabra dentro de una frase', () => {
	assert.equal(elegirOpcion(['the river'], OPCIONES).indice, 2);
});

test('lo que no se parece a ninguna opción no elige nada', () => {
	const resultado = elegirOpcion(['porque no nos acompañes'], OPCIONES);
	assert.equal(resultado.indice, -1);
	assert.equal(resultado.motivo, 'ninguna');
});

test('si no se oyó nada, el motivo es "nada"', () => {
	assert.deepEqual(elegirOpcion([], OPCIONES), { indice: -1, motivo: 'nada' });
	assert.deepEqual(elegirOpcion(['', '  ¡! '], OPCIONES), { indice: -1, motivo: 'nada' });
});

test('si el jugador dice dos opciones, es ambigua: no se elige ninguna (no vale adivinar)', () => {
	const resultado = elegirOpcion(['danger party'], OPCIONES);
	assert.equal(resultado.indice, -1);
	assert.equal(resultado.motivo, 'ambigua');
});

test('una opción exacta gana a otra que solo se parece', () => {
	// "run" exacto (0) contra "ran"... que no es opción: aquí "write" queda a 4 y fuera.
	assert.equal(elegirOpcion(['run'], ['sleep', 'write', 'run']).indice, 2);
	// Dos opciones dentro de la tolerancia, pero una exacta: gana la exacta.
	assert.equal(elegirOpcion(['bat'], ['bat', 'bag', 'xyz']).indice, 0);
});

test('un empate entre dos opciones parecidas es ambiguo', () => {
	assert.equal(elegirOpcion(['bar'], ['bat', 'bag', 'xyz']).motivo, 'ambigua');
});

test('las palabras cortas toleran una letra, y no más', () => {
	const opciones = ['sleep', 'write', 'run'];
	assert.equal(elegirOpcion(['ran'], opciones).indice, 2); // 1 edición
	assert.equal(elegirOpcion(['rum'], opciones).indice, 2); // 1 edición
	assert.equal(elegirOpcion(['rim'], opciones).motivo, 'ninguna'); // 2 ediciones: ya es mucho
	assert.equal(elegirOpcion(['ob'], opciones).motivo, 'ninguna'); // 3 ediciones
});

test('una opción de dos palabras se compara entera', () => {
	assert.equal(elegirOpcion(['ice cream'], ['ice cream', 'window', 'tired']).indice, 0);
});

test('el enunciado de una ficha no se parece a ninguna opción: no se acierta leyéndolo', () => {
	// Si la definición contiene la respuesta (o una palabra casi igual, como "teaches" y "teacher"),
	// el jugador acertaría leyendo la pantalla en voz alta, sin saber la palabra.
	for (const ficha of FICHAS_DE_PRUEBA) {
		assert.equal(elegirOpcion([ficha.enunciado], ficha.opciones).indice, -1, ficha.enunciado);
	}
});

// --- Las fichas de prueba ---

test('las fichas de prueba tienen la forma esperada', () => {
	assert.equal(FICHAS_DE_PRUEBA.length, 10);
	for (const ficha of FICHAS_DE_PRUEBA) {
		assert.ok(['traduccion', 'definicion'].includes(ficha.tipo), ficha.enunciado);
		assert.ok(ficha.enunciado.length > 0);
		assert.equal(ficha.opciones.length, 3, ficha.enunciado);
		assert.ok(Number.isInteger(ficha.correcta));
		assert.ok(ficha.correcta >= 0 && ficha.correcta < 3, ficha.enunciado);
	}
});

test('las tres opciones de cada ficha son completamente distintas', () => {
	for (const ficha of FICHAS_DE_PRUEBA) {
		assert.ok(opcionesDistintas(ficha.opciones), `Opciones parecidas en: ${ficha.enunciado}`);
	}
});

test('cada palabra dicha tal cual elige la opción correcta de su ficha', () => {
	for (const ficha of FICHAS_DE_PRUEBA) {
		const dicha = ficha.opciones[ficha.correcta];
		const resultado = elegirOpcion([dicha], ficha.opciones);
		assert.equal(resultado.indice, ficha.correcta, ficha.enunciado);
		assert.equal(resultado.exacta, true);
	}
});

test('no se repite ninguna respuesta entre las fichas de prueba', () => {
	const respuestas = FICHAS_DE_PRUEBA.map(({ opciones, correcta }) => opciones[correcta]);
	assert.equal(new Set(respuestas).size, respuestas.length);
});

test('opcionesDistintas rechaza empezar igual, contenerse o parecerse mucho', () => {
	assert.equal(opcionesDistintas(['house', 'water', 'tired']), true);
	assert.equal(opcionesDistintas(['house', 'happy', 'tired']), false); // misma inicial
	assert.equal(opcionesDistintas(['sun', 'sunset', 'tired']), false); // una contiene a otra
	assert.equal(opcionesDistintas(['ship', 'chip', 'tired']), false); // casi iguales
	assert.equal(opcionesDistintas(['ship', 'sheep', 'tired']), false);
});
