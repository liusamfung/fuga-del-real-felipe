import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIFICULTADES, PALABRAS, elegirPalabra } from '../src/datos/palabras.js';
import { Deletreo } from '../src/sistemas/Deletreo.js';
import {
	letrasDeLaPalabra,
	letrasEsperadas,
	normalizarLetra,
	tiempoParaLaPalabra,
} from '../src/utilidades/deletreo.js';

const TIEMPO = 5000;
const crear = (palabra, opciones = {}) => {
	const deletreo = new Deletreo({ palabra, tiempoTotal: TIEMPO, ...opciones });
	deletreo.empezar(1000);
	return deletreo;
};
const escribirTodo = (deletreo, texto, ahora = 1100) =>
	[...texto].map((letra) => deletreo.escribir(letra, ahora));

// --- Letras ---

test('normalizarLetra pasa a mayúscula y quita las tildes y la diéresis', () => {
	assert.equal(normalizarLetra('a'), 'A');
	assert.equal(normalizarLetra('Ó'), 'O');
	assert.equal(normalizarLetra('í'), 'I');
	assert.equal(normalizarLetra('ü'), 'U');
});

test('la Ñ se conserva: no es una N con tilde', () => {
	assert.equal(normalizarLetra('ñ'), 'Ñ');
	assert.equal(normalizarLetra('Ñ'), 'Ñ');
	assert.notEqual(normalizarLetra('ñ'), normalizarLetra('n'));
});

test('normalizarLetra devuelve null para lo que no es una letra suelta', () => {
	for (const caracter of ['1', ' ', '-', '', 'ab', 'Shift', 'Enter', undefined, null, 7]) {
		assert.equal(normalizarLetra(caracter), null, `${String(caracter)}`);
	}
});

test('letrasDeLaPalabra normaliza cada letra e ignora espacios y guiones', () => {
	assert.deepEqual(letrasDeLaPalabra('CAÑÓN'), ['C', 'A', 'Ñ', 'O', 'N']);
	assert.deepEqual(letrasDeLaPalabra('Real Felipe'), [...'REALFELIPE']);
	assert.deepEqual(letrasDeLaPalabra('a-b'), ['A', 'B']);
});

test('al revés, FERROCARRIL se deletrea L I R R A C O R R E F', () => {
	assert.deepEqual(letrasEsperadas('FERROCARRIL', true).join(' '), 'L I R R A C O R R E F');
	assert.deepEqual(letrasEsperadas('FERROCARRIL', false).join(''), 'FERROCARRIL');
});

test('letrasEsperadas no cambia la lista de la palabra al invertir', () => {
	const palabra = 'CALLAO';
	const normal = letrasEsperadas(palabra);
	letrasEsperadas(palabra, true);

	assert.deepEqual(letrasEsperadas(palabra), normal);
});

test('el tiempo es una base más un tiempo por letra, y al revés se multiplica', () => {
	const tiempos = { base: 1500, porLetra: 400, factorInvertida: 1.5 };

	assert.equal(tiempoParaLaPalabra(5, tiempos), 3500);
	assert.equal(tiempoParaLaPalabra(11, tiempos), 5900);
	assert.equal(tiempoParaLaPalabra(5, tiempos, true), 5250);
	assert.equal(
		tiempoParaLaPalabra(5, { base: 1000, porLetra: 100 }, true),
		1500,
		'sin factor, no cambia',
	);
});

// --- Deletreo ---

test('escribir todas las letras en orden acierta la palabra', () => {
	const deletreo = crear('CALLAO');

	assert.deepEqual(escribirTodo(deletreo, 'CALLAO'), Array(6).fill('acierto'));
	assert.equal(deletreo.estado, 'acertada');
	assert.equal(deletreo.terminada, true);
	assert.equal(deletreo.errores, 0);
});

test('no importan las mayúsculas ni las tildes', () => {
	assert.equal(escribirTodo(crear('PÓLVORA'), 'polvora').at(-1), 'acierto');
	const deletreo = crear('CAÑÓN');
	escribirTodo(deletreo, 'cañon');
	assert.equal(deletreo.estado, 'acertada');
});

test('la N no cuenta como Ñ', () => {
	const deletreo = crear('CAÑÓN', { erroresPermitidos: 1 });

	assert.equal(deletreo.escribir('c', 1100), 'acierto');
	assert.equal(deletreo.escribir('a', 1100), 'acierto');
	assert.equal(deletreo.escribir('n', 1100), 'error');
	assert.equal(deletreo.escribir('ñ', 1100), 'acierto');
});

test('una letra equivocada no avanza la palabra y cuenta como error', () => {
	const deletreo = crear('ASEDIO', { erroresPermitidos: 2 });

	deletreo.escribir('a', 1100);
	assert.equal(deletreo.escribir('z', 1100), 'error');
	assert.equal(deletreo.indice, 1);
	assert.equal(deletreo.errores, 1);
	assert.equal(deletreo.letraEsperada, 'S');
	assert.equal(deletreo.estado, 'activo');
});

test('con 2 errores permitidos se falla al tercero', () => {
	const deletreo = crear('ASEDIO', { erroresPermitidos: 2 });

	deletreo.escribir('z', 1100);
	deletreo.escribir('z', 1100);
	assert.equal(deletreo.estado, 'activo');
	deletreo.escribir('z', 1100);
	assert.equal(deletreo.estado, 'fallada');
});

test('sin errores permitidos, la primera letra equivocada falla', () => {
	const deletreo = crear('ASEDIO');

	assert.equal(deletreo.escribir('x', 1100), 'error');
	assert.equal(deletreo.estado, 'fallada');
});

test('lo que no es una letra se ignora y no cuenta como error', () => {
	const deletreo = crear('ASEDIO');

	for (const tecla of ['1', ' ', 'Shift', 'Enter', '']) {
		assert.equal(deletreo.escribir(tecla, 1100), 'ignorada');
	}
	assert.equal(deletreo.errores, 0);
	assert.equal(deletreo.estado, 'activo');
});

test('el tiempo se acaba justo al cumplirse el tiempo total, no antes', () => {
	const deletreo = crear('ASEDIO');

	assert.equal(deletreo.actualizar(1000 + TIEMPO - 1), 'activo');
	assert.equal(deletreo.actualizar(1000 + TIEMPO), 'tiempo-agotado');
});

test('una letra correcta justo cuando se acaba el tiempo ya no cuenta', () => {
	const deletreo = crear('ASEDIO');

	assert.equal(deletreo.escribir('a', 1000 + TIEMPO - 1), 'acierto');
	assert.equal(deletreo.escribir('s', 1000 + TIEMPO), 'ignorada');
	assert.equal(deletreo.estado, 'tiempo-agotado');
	assert.equal(deletreo.indice, 1);
});

test('completar la última letra a tiempo acierta, y después ya no cambia de estado', () => {
	const deletreo = crear('RODIL');
	escribirTodo(deletreo, 'rodil', 1000 + TIEMPO - 1);

	assert.equal(deletreo.estado, 'acertada');
	assert.equal(deletreo.actualizar(1000 + 10 * TIEMPO), 'acertada', 'el tiempo ya no importa');
	assert.equal(deletreo.escribir('x', 1000 + 10 * TIEMPO), 'ignorada');
});

test('una palabra fallada o agotada ignora las letras siguientes', () => {
	const fallada = crear('RODIL');
	fallada.escribir('x', 1100);
	assert.equal(fallada.escribir('r', 1100), 'ignorada');
	assert.equal(fallada.indice, 0);
});

test('al revés hay que escribir de la última letra a la primera', () => {
	const bien = crear('CALLAO', { invertida: true });
	assert.equal(escribirTodo(bien, 'OALLAC').at(-1), 'acierto');
	assert.equal(bien.estado, 'acertada');

	const mal = crear('CALLAO', { invertida: true });
	assert.equal(mal.escribir('c', 1100), 'error', 'en el orden normal no vale');
});

test('el tiempo restante y su fracción bajan de 1 a 0 y no son negativos', () => {
	const deletreo = crear('RODIL');

	assert.equal(deletreo.tiempoRestante(1000), TIEMPO);
	assert.equal(deletreo.fraccionRestante(1000), 1);
	assert.equal(deletreo.fraccionRestante(1000 + TIEMPO / 2), 0.5);
	assert.equal(deletreo.fraccionRestante(1000 + TIEMPO), 0);
	assert.equal(deletreo.fraccionRestante(1000 + 3 * TIEMPO), 0);
});

test('una palabra sin letras es un error claro', () => {
	assert.throws(() => new Deletreo({ palabra: '--', tiempoTotal: TIEMPO }), /no tiene letras/);
});

// --- Banco de palabras ---

test('todas las palabras del banco tienen letras y se pueden deletrear completas', () => {
	for (const dificultad of DIFICULTADES) {
		assert.ok(PALABRAS[dificultad].length >= 3, `muy pocas palabras en ${dificultad}`);
		for (const palabra of PALABRAS[dificultad]) {
			const deletreo = crear(palabra);
			const letras = letrasDeLaPalabra(palabra);

			assert.ok(letras.length >= 4, `${palabra} es muy corta`);
			escribirTodo(deletreo, letras.join(''));
			assert.equal(deletreo.estado, 'acertada', palabra);
		}
	}
});

test('las palabras difíciles son más largas que las fáciles', () => {
	const largo = (dificultad) =>
		Math.min(...PALABRAS[dificultad].map((p) => letrasDeLaPalabra(p).length));

	assert.ok(largo('dificil') > largo('facil'));
});

test('elegirPalabra elige del grupo que se pidió y falla con una dificultad desconocida', () => {
	assert.equal(
		elegirPalabra('facil', () => 0),
		PALABRAS.facil[0],
	);
	assert.equal(
		elegirPalabra('dificil', () => 0.999999),
		PALABRAS.dificil.at(-1),
	);
	assert.throws(() => elegirPalabra('imposible'), /Dificultad desconocida/);
});
