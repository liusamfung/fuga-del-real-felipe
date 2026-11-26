import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VOCABULARIO } from '../src/datos/vocabulario.js';
import { RetoDeOpciones } from '../src/sistemas/RetoDeOpciones.js';
import { armarFicha, tiempoParaLaFicha, NIVELES_DE_INGLES } from '../src/utilidades/fichas.js';

const TIEMPO = 8000;
const OPCIONES = ['danger', 'party', 'river'];

// Un reto ya empezado en el instante 1000, con "party" (la posición 1) como respuesta correcta.
const crear = (extra = {}) => {
	const reto = new RetoDeOpciones({
		opciones: OPCIONES,
		correcta: 1,
		tiempoTotal: TIEMPO,
		...extra,
	});
	reto.empezar(1000);
	return reto;
};

// --- Empezar y el tiempo ---

test('un reto nuevo espera: el tiempo no corre y no se puede responder', () => {
	const reto = new RetoDeOpciones({ opciones: OPCIONES, correcta: 1, tiempoTotal: TIEMPO });
	assert.equal(reto.estado, 'esperando');
	assert.equal(reto.terminada, false);
	assert.equal(reto.tiempoRestante(99999), TIEMPO, 'esperando, siempre queda todo el tiempo');
	assert.equal(reto.fraccionRestante(99999), 1);
	assert.equal(reto.actualizar(99999), 'esperando', 'esperando no se acaba el tiempo');
	assert.equal(reto.elegir(1, 5000), 'ignorada');
	assert.equal(reto.oir(['party'], 5000), 'ignorada');
});

test('empezar activa el reto y el tiempo corre desde ese instante', () => {
	const reto = crear();
	assert.equal(reto.estado, 'activo');
	assert.equal(reto.tiempoRestante(1000), TIEMPO);
	assert.equal(reto.tiempoRestante(3000), 6000);
	assert.equal(reto.fraccionRestante(5000), 0.5);
	assert.equal(reto.tiempoRestante(1000 + TIEMPO + 500), 0, 'nunca baja de cero');
});

test('empezar otra vez no reinicia la cuenta (el micrófono se reinicia solo y avisa cada vez)', () => {
	const reto = crear();
	reto.empezar(6000);
	assert.equal(reto.inicio, 1000);
	assert.equal(reto.tiempoRestante(6000), TIEMPO - 5000);
});

test('al acabarse el tiempo el reto termina y ya no se puede responder', () => {
	const reto = crear();
	assert.equal(reto.actualizar(1000 + TIEMPO - 1), 'activo');
	assert.equal(reto.actualizar(1000 + TIEMPO), 'tiempo-agotado');
	assert.equal(reto.terminada, true);
	assert.equal(reto.elegir(1, 1000 + TIEMPO + 1), 'ignorada');
	assert.equal(reto.elegida, null);
});

test('responder justo después de acabarse el tiempo no vale, aunque nadie llamara a actualizar', () => {
	const reto = crear();
	assert.equal(reto.elegir(1, 1000 + TIEMPO + 10), 'ignorada');
	assert.equal(reto.estado, 'tiempo-agotado');
	assert.equal(reto.oir(['party'], 1000 + TIEMPO + 10), 'ignorada');
});

// --- Elegir por posición (plan B del teclado) ---

test('elegir la correcta acierta y termina', () => {
	const reto = crear();
	assert.equal(reto.elegir(1, 2000), 'acierto');
	assert.equal(reto.estado, 'acertada');
	assert.equal(reto.elegida, 1);
	assert.equal(reto.terminada, true);
});

test('elegir otra falla y termina', () => {
	const reto = crear();
	assert.equal(reto.elegir(0, 2000), 'error');
	assert.equal(reto.estado, 'fallada');
	assert.equal(reto.elegida, 0);
});

test('la primera elección es la que vale: después no se puede cambiar', () => {
	const reto = crear();
	reto.elegir(0, 2000);
	assert.equal(reto.elegir(1, 2100), 'ignorada');
	assert.equal(reto.estado, 'fallada');
	assert.equal(reto.elegida, 0);
});

test('una posición que no existe, o que no es un número entero, se ignora', () => {
	const reto = crear();
	for (const indice of [-1, 3, 1.5, NaN, undefined, null, '1']) {
		assert.equal(reto.elegir(indice, 2000), 'ignorada', String(indice));
	}
	assert.equal(reto.estado, 'activo', 'sigue esperando una respuesta');
});

// --- Responder con la voz ---

test('lo oído que encaja con la correcta acierta', () => {
	const reto = crear();
	assert.equal(reto.oir(['party'], 2000), 'acierto');
	assert.equal(reto.estado, 'acertada');
	assert.equal(reto.elegida, 1);
});

test('lo oído que encaja con otra opción falla', () => {
	const reto = crear();
	assert.equal(reto.oir(['danger'], 2000), 'error');
	assert.equal(reto.estado, 'fallada');
});

test('el acento no importa: "dancer" vale como "danger" (una letra de diferencia)', () => {
	const reto = crear({ correcta: 0 });
	assert.equal(reto.oir(['dancer'], 2000), 'acierto');
});

test('lo oído que no se parece a ninguna opción no hace nada y se sigue escuchando', () => {
	const reto = crear();
	assert.equal(reto.oir(['porque no nos acompañes'], 2000), 'ignorada');
	assert.equal(reto.oir([], 2100), 'ignorada');
	assert.equal(reto.estado, 'activo');
	assert.equal(reto.elegida, null);
	assert.equal(reto.oir(['party'], 2200), 'acierto', 'luego sí puede responder');
});

test('si el jugador dice dos opciones, no se elige ninguna (no vale adivinar)', () => {
	const reto = crear();
	assert.equal(reto.oir(['danger party'], 2000), 'ignorada');
	assert.equal(reto.estado, 'activo');
});

test('lo oído antes y lo oído ahora cuentan juntos: se pasa la lista completa', () => {
	const reto = crear();
	assert.equal(reto.oir(['the'], 2000), 'ignorada');
	assert.equal(
		reto.oir(['the', 'pa', 'par'], 2100),
		'ignorada',
		'"par" aún no se parece lo bastante',
	);
	assert.equal(reto.oir(['the', 'pa', 'party'], 2200), 'acierto');
});

test('la tolerancia (letras por error) se puede cambiar', () => {
	// "dxxxer" está a 3 ediciones de "danger": por defecto (1 por cada 3 letras = 2) no vale...
	assert.equal(crear({ correcta: 0 }).oir(['dxxxer'], 2000), 'ignorada');
	// ...pero con 1 edición por cada 2 letras (= 3) sí.
	assert.equal(crear({ correcta: 0, letrasPorError: 2 }).oir(['dxxxer'], 2000), 'acierto');
});

// --- Validación ---

test('un reto necesita al menos dos opciones y una correcta que exista', () => {
	assert.throws(
		() => new RetoDeOpciones({ opciones: ['solo'], correcta: 0, tiempoTotal: 1 }),
		/al menos dos/,
	);
	assert.throws(
		() => new RetoDeOpciones({ opciones: 'abc', correcta: 0, tiempoTotal: 1 }),
		/al menos dos/,
	);
	for (const correcta of [-1, 3, 0.5, undefined]) {
		assert.throws(
			() => new RetoDeOpciones({ opciones: OPCIONES, correcta, tiempoTotal: 1 }),
			/no está entre las opciones/,
			String(correcta),
		);
	}
});

// --- Con las fichas del banco de vocabulario ---

test('tiempoParaLaFicha da más tiempo a las definiciones largas que a una palabra sola', () => {
	const tiempos = { base: 6000, porPalabra: 500 };
	assert.equal(tiempoParaLaFicha({ enunciado: 'gato' }, tiempos), 6500);
	assert.equal(tiempoParaLaFicha({ enunciado: 'a long thin animal' }, tiempos), 8000);
	assert.equal(tiempoParaLaFicha({ enunciado: '  muchos   espacios  ' }, tiempos), 7000);
	assert.equal(tiempoParaLaFicha({ enunciado: '' }, tiempos), 6000);
});

test('con cualquier ficha del banco, decir la respuesta correcta acierta y decir otra opción falla', () => {
	let n = 0;
	const azar = () => ((n += 7) % 100) / 100; // un "azar" fijo, que cambia de una vez a otra

	for (const entrada of VOCABULARIO) {
		for (const nivel of [NIVELES_DE_INGLES.TRADUCCION, NIVELES_DE_INGLES.DEFINICION]) {
			const ficha = armarFicha(entrada, nivel, VOCABULARIO, azar);
			const nuevo = () =>
				new RetoDeOpciones({
					opciones: ficha.opciones,
					correcta: ficha.correcta,
					tiempoTotal: tiempoParaLaFicha(ficha, { base: 6000, porPalabra: 500 }),
				});
			const donde = `${entrada.palabra} nivel ${nivel}`;

			const bien = nuevo();
			bien.empezar(0);
			assert.equal(bien.oir([entrada.palabra], 100), 'acierto', donde);

			const mal = nuevo();
			mal.empezar(0);
			const otra = ficha.opciones.find((opcion) => opcion !== entrada.palabra);
			assert.equal(mal.oir([otra], 100), 'error', donde);

			// Leer en voz alta lo que se ve en pantalla (el enunciado) no responde nada.
			const leyendo = nuevo();
			leyendo.empezar(0);
			assert.equal(leyendo.oir([ficha.enunciado], 100), 'ignorada', `leer el enunciado: ${donde}`);
		}
	}
});
