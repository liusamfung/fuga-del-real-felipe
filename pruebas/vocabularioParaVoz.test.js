import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import {
	ESTADOS_DE_VOZ_QUE_SIRVEN,
	VOCABULARIO,
	VOCABULARIO_PARA_VOZ,
} from '../src/datos/vocabulario.js';
import { armarFicha, elegirEntrada, NIVELES_DE_INGLES } from '../src/utilidades/fichas.js';

// El banco para los retos POR VOZ (27/11/2026): Chrome no entrega texto para algunas palabras, así que los niveles 1 y 2
// usan solo las que se reconocen bien. El dictado (se escribe con el teclado) conserva todas.
const ESTADOS = ['probada', 'probable', 'sin-probar', 'falla'];
// Lo que el usuario comprobó con su micrófono el 27/11/2026.
const FALLAN = ['boat', 'leg', 'tail', 'wave', 'duck', 'wheel', 'heart'];
const FUNCIONAN = ['rabbit', 'carrot', 'village', 'black', 'expensive'];

const conSemilla = (semilla) => {
	let estado = semilla;
	return () => {
		estado = (estado * 1664525 + 1013904223) % 4294967296;
		return estado / 4294967296;
	};
};
const entrada = (palabra) => VOCABULARIO.find((e) => e.palabra === palabra);

test('cada palabra del banco dice si se reconoce bien por voz, con uno de los cuatro estados', () => {
	for (const { palabra, voz } of VOCABULARIO) {
		assert.ok(ESTADOS.includes(voz), `${palabra}: voz = ${voz}`);
	}
});

test('las palabras que el usuario comprobó que fallan están marcadas y no entran en los retos por voz', () => {
	for (const palabra of FALLAN) {
		assert.equal(entrada(palabra).voz, 'falla', palabra);
		assert.ok(
			!VOCABULARIO_PARA_VOZ.some((e) => e.palabra === palabra),
			`${palabra} se usaría por voz`,
		);
	}
});

test('las palabras que el usuario comprobó que funcionan están marcadas como probadas y sí se usan', () => {
	for (const palabra of FUNCIONAN) {
		assert.equal(entrada(palabra).voz, 'probada', palabra);
		assert.ok(
			VOCABULARIO_PARA_VOZ.some((e) => e.palabra === palabra),
			`${palabra} no se usa`,
		);
	}
});

test('el banco para voz tiene exactamente las palabras probadas o probables, y ninguna que falle o esté sin probar', () => {
	assert.deepEqual(ESTADOS_DE_VOZ_QUE_SIRVEN, ['probada', 'probable']);
	const esperadas = VOCABULARIO.filter((e) => ['probada', 'probable'].includes(e.voz));
	assert.deepEqual(VOCABULARIO_PARA_VOZ, esperadas);
	for (const { palabra, voz } of VOCABULARIO_PARA_VOZ) {
		assert.ok(voz !== 'falla' && voz !== 'sin-probar', `${palabra}: ${voz}`);
	}
});

test('el dictado conserva TODAS las palabras: las 60 (se escribe con el teclado, no depende de Chrome)', () => {
	assert.equal(VOCABULARIO.length, 60);
	assert.ok(
		VOCABULARIO.some((e) => e.palabra === 'leg'),
		'leg sigue en el dictado',
	);
});

test('el banco para voz alcanza: hay más palabras que las que no se repiten seguidas y varias categorías', () => {
	assert.ok(
		VOCABULARIO_PARA_VOZ.length >= CONFIG.INGLES.NO_REPETIR + 3,
		`${VOCABULARIO_PARA_VOZ.length} palabras con NO_REPETIR = ${CONFIG.INGLES.NO_REPETIR}`,
	);
	assert.ok(new Set(VOCABULARIO_PARA_VOZ.map((e) => e.categoria)).size >= 6);
});

test('con las palabras que se acaban de usar apartadas siempre sale otra del banco para voz', () => {
	const azar = conSemilla(7);
	let recientes = [];
	for (let i = 0; i < 400; i += 1) {
		const elegida = elegirEntrada(VOCABULARIO_PARA_VOZ, { evitar: recientes, azar });
		assert.ok(elegida, 'no salió ninguna palabra');
		assert.ok(!recientes.includes(elegida.palabra), `${elegida.palabra} se repitió enseguida`);
		recientes = [...recientes, elegida.palabra].slice(-CONFIG.INGLES.NO_REPETIR);
	}
});

test('todas las fichas por voz (niveles 1 y 2) se arman con tres opciones distintas, todas del banco para voz', () => {
	const permitidas = new Set(VOCABULARIO_PARA_VOZ.map((e) => e.palabra));
	for (const nivel of [NIVELES_DE_INGLES.TRADUCCION, NIVELES_DE_INGLES.DEFINICION]) {
		for (const base of VOCABULARIO_PARA_VOZ) {
			for (let semilla = 1; semilla <= 30; semilla += 1) {
				const ficha = armarFicha(base, nivel, VOCABULARIO_PARA_VOZ, conSemilla(semilla));
				assert.equal(ficha.opciones.length, 3);
				assert.equal(new Set(ficha.opciones).size, 3, `${base.palabra}: opciones repetidas`);
				assert.equal(ficha.opciones[ficha.correcta], base.palabra);
				for (const opcion of ficha.opciones) {
					assert.ok(
						permitidas.has(opcion),
						`${base.palabra}: la opción «${opcion}» no sirve por voz`,
					);
				}
				for (const mala of FALLAN) {
					assert.ok(!ficha.opciones.includes(mala), `salió «${mala}», que Chrome no entiende`);
				}
			}
		}
	}
});

test('las opciones equivocadas son de otras categorías que la respuesta, también con el banco reducido', () => {
	for (const base of VOCABULARIO_PARA_VOZ) {
		const ficha = armarFicha(
			base,
			NIVELES_DE_INGLES.TRADUCCION,
			VOCABULARIO_PARA_VOZ,
			conSemilla(3),
		);
		ficha.opciones.forEach((opcion, i) => {
			if (i !== ficha.correcta) {
				const otra = VOCABULARIO_PARA_VOZ.find((e) => e.palabra === opcion);
				assert.notEqual(otra.categoria, base.categoria, `${base.palabra} y ${opcion}`);
			}
		});
	}
});
