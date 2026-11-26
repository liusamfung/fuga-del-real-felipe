import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VOCABULARIO } from '../src/datos/vocabulario.js';
import { barajar } from '../src/utilidades/azar.js';
import { armarFicha, elegirEntrada, NIVELES_DE_INGLES } from '../src/utilidades/fichas.js';
import { elegirOpcion, opcionesDistintas } from '../src/utilidades/opciones.js';

const { TRADUCCION, DEFINICION, DICTADO } = NIVELES_DE_INGLES;

// Generador de números al azar con semilla (mulberry32): da siempre la misma secuencia, así las
// pruebas con "azar" se pueden repetir y, si fallan, se puede ver con qué semilla.
function conSemilla(semilla) {
	let estado = semilla >>> 0;
	return () => {
		estado = (estado + 0x6d2b79f5) >>> 0;
		let t = estado;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// --- barajar ---

test('barajar devuelve las mismas cosas en otro orden, sin tocar la lista original', () => {
	const original = [1, 2, 3, 4, 5, 6, 7, 8];
	const barajada = barajar(original, conSemilla(1));
	assert.deepEqual(original, [1, 2, 3, 4, 5, 6, 7, 8]);
	assert.deepEqual([...barajada].sort(), original);
	assert.notDeepEqual(barajada, original);
});

test('barajar con la misma semilla da el mismo orden', () => {
	const lista = ['a', 'b', 'c', 'd', 'e'];
	assert.deepEqual(barajar(lista, conSemilla(7)), barajar(lista, conSemilla(7)));
});

test('barajar una lista vacía o de un elemento no falla', () => {
	assert.deepEqual(barajar([]), []);
	assert.deepEqual(barajar(['x']), ['x']);
});

// --- El banco de vocabulario ---

test('el banco tiene 60 palabras de los libros 1 y 2', () => {
	assert.equal(VOCABULARIO.length, 60);
	assert.equal(VOCABULARIO.filter((e) => e.libro === 1).length, 30);
	assert.equal(VOCABULARIO.filter((e) => e.libro === 2).length, 30);
});

test('cada entrada tiene todos sus campos con la forma esperada', () => {
	for (const entrada of VOCABULARIO) {
		const { palabra, libro, categoria, traduccion, definicion } = entrada;
		assert.match(palabra, /^[a-z]+$/, `palabra: ${palabra}`); // en el nivel 3 se escribe tal cual
		assert.ok([1, 2].includes(libro), palabra);
		assert.match(categoria, /^[a-z]+$/, palabra);
		assert.match(traduccion, /^[a-zñáéíóú]+$/, `traducción de ${palabra}: una sola palabra`);
		assert.ok(definicion.trim().length > 0, palabra);
		assert.ok(
			definicion.split(/\s+/).length <= 16,
			`La definición de ${palabra} es larga: se lee con prisa`,
		);
		assert.ok(Object.isFrozen(entrada), palabra);
	}
});

test('no se repite ninguna palabra, traducción ni definición', () => {
	for (const campo of ['palabra', 'traduccion', 'definicion']) {
		const valores = VOCABULARIO.map((entrada) => entrada[campo]);
		assert.equal(new Set(valores).size, valores.length, `Se repite: ${campo}`);
	}
});

test('la definición no contiene la respuesta ni una palabra casi igual', () => {
	for (const { palabra, definicion } of VOCABULARIO) {
		assert.equal(elegirOpcion([definicion], [palabra]).indice, -1, `${palabra}: ${definicion}`);
	}
});

test('la traducción no se parece a la respuesta (nada de cognados idénticos)', () => {
	for (const { palabra, traduccion } of VOCABULARIO) {
		assert.equal(elegirOpcion([traduccion], [palabra]).indice, -1, `${palabra} / ${traduccion}`);
	}
});

test('hay bastantes categorías para que las opciones siempre salgan de tres distintas', () => {
	const categorias = new Set(VOCABULARIO.map((entrada) => entrada.categoria));
	assert.ok(categorias.size >= 10, `Solo hay ${categorias.size} categorías`);
});

// --- Armar fichas ---

test('armarFicha de traducción: enunciado en español y tres opciones con la correcta', () => {
	const gato = VOCABULARIO.find((e) => e.palabra === 'cat');
	const ficha = armarFicha(gato, TRADUCCION, VOCABULARIO, conSemilla(3));
	assert.equal(ficha.nivel, 1);
	assert.equal(ficha.tipo, 'traduccion');
	assert.equal(ficha.enunciado, 'gato');
	assert.equal(ficha.opciones.length, 3);
	assert.equal(ficha.opciones[ficha.correcta], 'cat');
});

test('armarFicha de definición usa la definición como enunciado', () => {
	const puerta = VOCABULARIO.find((e) => e.palabra === 'door');
	const ficha = armarFicha(puerta, DEFINICION, VOCABULARIO, conSemilla(3));
	assert.equal(ficha.tipo, 'definicion');
	assert.equal(ficha.enunciado, puerta.definicion);
	assert.equal(ficha.opciones[ficha.correcta], 'door');
});

test('armarFicha de dictado no tiene opciones: solo la palabra', () => {
	const ficha = armarFicha(VOCABULARIO[0], DICTADO, VOCABULARIO);
	assert.deepEqual(ficha, { nivel: 3, tipo: 'dictado', palabra: VOCABULARIO[0].palabra });
});

test('un nivel desconocido es un error, no una ficha rota', () => {
	assert.throws(() => armarFicha(VOCABULARIO[0], 9, VOCABULARIO), /Nivel de inglés desconocido/);
});

test('con la misma semilla sale la misma ficha; con otra, puede cambiar', () => {
	const entrada = VOCABULARIO.find((e) => e.palabra === 'horse');
	const a = armarFicha(entrada, DEFINICION, VOCABULARIO, conSemilla(11));
	const b = armarFicha(entrada, DEFINICION, VOCABULARIO, conSemilla(11));
	assert.deepEqual(a, b);

	const distintas = new Set();
	for (let semilla = 0; semilla < 30; semilla += 1) {
		const ficha = armarFicha(entrada, DEFINICION, VOCABULARIO, conSemilla(semilla));
		distintas.add(ficha.opciones.join(','));
	}
	assert.ok(distintas.size > 5, 'Las opciones equivocadas deberían variar de una vez a otra');
});

test('TODAS las fichas posibles cumplen las reglas de diseño (60 palabras × 2 niveles × 60 semillas)', () => {
	for (const entrada of VOCABULARIO) {
		for (const nivel of [TRADUCCION, DEFINICION]) {
			for (let semilla = 0; semilla < 60; semilla += 1) {
				const ficha = armarFicha(entrada, nivel, VOCABULARIO, conSemilla(semilla));
				const donde = `${entrada.palabra} nivel ${nivel} semilla ${semilla}`;

				assert.ok(ficha, `No se pudo armar la ficha: ${donde}`);
				assert.equal(ficha.opciones.length, 3, donde);
				assert.equal(ficha.opciones[ficha.correcta], entrada.palabra, donde);
				assert.equal(new Set(ficha.opciones).size, 3, `Opciones repetidas: ${donde}`);
				assert.ok(
					opcionesDistintas(ficha.opciones),
					`Opciones parecidas: ${ficha.opciones} (${donde})`,
				);

				// Ninguna palabra de la pantalla se parece a una opción: no se acierta leyendo.
				assert.equal(
					elegirOpcion([ficha.enunciado], ficha.opciones).indice,
					-1,
					`El enunciado se parece a una opción: ${ficha.enunciado} / ${ficha.opciones} (${donde})`,
				);

				// Las tres opciones son de tres categorías distintas.
				const categorias = ficha.opciones.map(
					(palabra) => VOCABULARIO.find((e) => e.palabra === palabra).categoria,
				);
				assert.equal(new Set(categorias).size, 3, `Misma categoría: ${categorias} (${donde})`);
			}
		}
	}
});

test('si el banco no alcanza para armar las opciones, devuelve null', () => {
	const pocas = VOCABULARIO.filter((e) => e.categoria === 'animal').slice(0, 3);
	assert.equal(armarFicha(pocas[0], TRADUCCION, pocas, conSemilla(1)), null);
});

// --- Elegir la palabra ---

test('elegirEntrada respeta los libros pedidos', () => {
	for (let semilla = 0; semilla < 40; semilla += 1) {
		assert.equal(elegirEntrada(VOCABULARIO, { libros: [2], azar: conSemilla(semilla) }).libro, 2);
	}
});

test('elegirEntrada no repite las palabras de "evitar"', () => {
	const evitar = VOCABULARIO.slice(0, 59).map((e) => e.palabra);
	for (let semilla = 0; semilla < 20; semilla += 1) {
		const entrada = elegirEntrada(VOCABULARIO, { evitar, azar: conSemilla(semilla) });
		assert.equal(entrada.palabra, VOCABULARIO[59].palabra);
	}
});

test('si "evitar" deja el banco vacío, se repite antes que quedarse sin palabra', () => {
	const evitar = VOCABULARIO.map((e) => e.palabra);
	assert.ok(elegirEntrada(VOCABULARIO, { evitar }));
});

test('elegirEntrada devuelve null si no hay palabras en esos libros', () => {
	assert.equal(elegirEntrada(VOCABULARIO, { libros: [6] }), null);
	assert.equal(elegirEntrada([]), null);
});
