import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ReconocedorDeVoz } from '../src/sistemas/ReconocedorDeVoz.js';
import {
	diagnosticoDeLaVoz,
	ESPERA_DEL_DIAGNOSTICO,
	resumenDeLaVoz,
} from '../src/utilidades/diagnosticoDeVoz.js';

// El diagnóstico de por qué el micrófono «escucha» pero no llega ningún texto (27/11/2026): la función pura que
// elige el mensaje y el reconocedor que avisa de cada cosa que dice Chrome.
const nada = { audio: false, sonido: false, voz: false, resultados: 0, abortos: 0 };
const mensaje = (cambios, ms = 5000) => diagnosticoDeLaVoz({ ...nada, ...cambios }, ms);

test('no dice nada antes de esperar un rato: al principio es normal que no haya texto', () => {
	assert.equal(diagnosticoDeLaVoz(nada, 0), '');
	assert.equal(diagnosticoDeLaVoz(nada, ESPERA_DEL_DIAGNOSTICO - 1), '');
	assert.notEqual(
		diagnosticoDeLaVoz(nada, ESPERA_DEL_DIAGNOSTICO),
		'',
		'justo al cumplirse ya avisa',
	);
});

test('en cuanto llega algún resultado, no hay nada que diagnosticar', () => {
	assert.equal(mensaje({ audio: true, sonido: true, voz: true, resultados: 1 }), '');
	assert.equal(mensaje({ resultados: 3 }, 60000), '');
});

test('sin audio: Chrome no llegó a abrir el micrófono', () => {
	assert.match(mensaje({}), /no abre el micrófono/);
});

test('con audio pero sin sonido: a Chrome no le llega nada (el caso del micrófono equivocado o en silencio)', () => {
	const texto = mensaje({ audio: true });
	assert.match(texto, /no le llega sonido/);
	assert.match(texto, /micrófono/, 'dice qué revisar');
});

test('con sonido pero sin voz: oye ruido, no voz', () => {
	assert.match(mensaje({ audio: true, sonido: true }), /ruido pero no voz/);
});

test('con voz pero sin resultados: no culpa al internet (no lo sabe), sugiere decirla más fuerte y más claro', () => {
	const texto = mensaje({ audio: true, sonido: true, voz: true });
	assert.match(texto, /más fuerte y más claro/);
	assert.doesNotMatch(
		texto,
		/internet/,
		'el diagnóstico no sabe si hay internet: no debe afirmarlo',
	);
});

test('si el reconocimiento se corta solo varias veces, avisa de otra pestaña (tiene prioridad)', () => {
	const texto = mensaje({ audio: true, abortos: 2 });
	assert.match(texto, /otra pestaña/);
	assert.doesNotMatch(
		mensaje({ audio: true, abortos: 1 }),
		/otra pestaña/,
		'una sola vez no alcanza',
	);
});

test('cada caso da un mensaje distinto y corto: cabe en la línea de abajo del cartel (800 px)', () => {
	const casos = [
		mensaje({}),
		mensaje({ audio: true }),
		mensaje({ audio: true, sonido: true }),
		mensaje({ audio: true, sonido: true, voz: true }),
		mensaje({ audio: true, abortos: 2 }),
	];
	assert.equal(new Set(casos).size, casos.length);
	for (const texto of casos) {
		// La línea se dibuja en monoespaciado de 14 px (~8,4 px por carácter) y empieza con «⚠ »: con 85 caracteres
		// ocupa ~730 px de los 800 de la pantalla.
		assert.ok(texto.length > 20 && texto.length <= 85, `${texto.length} caracteres: ${texto}`);
	}
});

// --- El reconocedor avisa de cada cosa que dice Chrome ---

class Falso {
	static instancias = [];
	constructor() {
		Falso.instancias.push(this);
	}
	start() {
		this.onstart?.();
	}
	abort() {}
	stop() {}
}
const crear = () => {
	Falso.instancias = [];
	const eventos = [];
	const voz = new ReconocedorDeVoz({
		ventana: { webkitSpeechRecognition: Falso },
		esperaDeReinicio: 0,
		alEvento: (nombre) => eventos.push(nombre),
	});
	voz.iniciar();
	return { voz, eventos, chrome: () => Falso.instancias.at(-1) };
};
const resultado = (texto) => {
	const lista = [{ transcript: texto, confidence: 0.9 }];
	lista.isFinal = false;
	return { resultIndex: 0, results: [lista] };
};

test('avisa de cada evento de Chrome, en orden', () => {
	const { eventos, chrome } = crear();
	chrome().onaudiostart();
	chrome().onsoundstart();
	chrome().onspeechstart();
	chrome().onresult(resultado('bro'));
	chrome().onspeechend();
	chrome().onnomatch();

	assert.deepEqual(eventos, [
		'inicio',
		'audio',
		'sonido',
		'voz',
		'resultado',
		'fin-de-voz',
		'sin-coincidencia',
	]);
});

test('avisa también de los errores que se ignoran (no-speech y aborted): son la pista de qué falla', () => {
	const { eventos, chrome } = crear();
	chrome().onerror({ error: 'no-speech' });
	chrome().onerror({ error: 'aborted' });
	chrome().onerror({ error: 'network' });

	assert.deepEqual(eventos.slice(1), ['error:no-speech', 'error:aborted', 'error:network']);
});

test('avisa del fin y del reinicio automático', async () => {
	const { eventos, chrome } = crear();
	chrome().onend();
	await new Promise((listo) => setTimeout(listo, 15));

	assert.deepEqual(eventos, ['inicio', 'fin', 'inicio']);
});

test('lo que manda un reconocedor viejo se avisa con el prefijo «viejo:» y NUNCA llega al juego como texto', () => {
	Falso.instancias = [];
	const eventos = [];
	const textos = [];
	const voz = new ReconocedorDeVoz({
		ventana: { webkitSpeechRecognition: Falso },
		alEvento: (nombre) => eventos.push(nombre),
		alTexto: (t) => textos.push(t.texto),
	});
	voz.iniciar();
	const viejo = Falso.instancias[0];
	voz.detener();
	viejo.onaudiostart();
	viejo.onresult(resultado('tarde'));
	viejo.onerror({ error: 'no-speech' });
	viejo.onend();

	assert.deepEqual(eventos, [
		'inicio',
		'viejo:audio',
		'viejo:resultado',
		'viejo:error:no-speech',
		'viejo:fin',
	]);
	assert.deepEqual(textos, [], 'un resultado tardío se descarta');
});

test('un resultado de una sesión que se reinició se avisa como tardío y no cuenta como respuesta', async () => {
	const { eventos, chrome } = crear();
	const primera = chrome();
	primera.onend(); // Chrome cierra la sesión: se reinicia sola
	await new Promise((listo) => setTimeout(listo, 15));
	primera.onresult(resultado('llegó tarde'));

	assert.ok(eventos.includes('viejo:resultado'));
	assert.equal(eventos.filter((nombre) => nombre === 'resultado').length, 0);
});

test('por defecto el reconocimiento es continuo; con continuo: false es una sesión por frase', () => {
	Falso.instancias = [];
	new ReconocedorDeVoz({ ventana: { webkitSpeechRecognition: Falso } }).iniciar();
	assert.equal(Falso.instancias[0].continuous, true);

	new ReconocedorDeVoz({ ventana: { webkitSpeechRecognition: Falso }, continuo: false }).iniciar();
	assert.equal(Falso.instancias[1].continuous, false);
});

test('el resumen junta los contadores en una línea que cabe en la pantalla', () => {
	const linea = resumenDeLaVoz({ inicios: 3, noSpeech: 2, tardios: 1 }, true);
	assert.equal(linea, 'sesiones 3 · silencios 2 · tardíos 1 · modo continuo');
	assert.match(resumenDeLaVoz({ inicios: 0, noSpeech: 0, tardios: 0 }, false), /modo corto/);
	assert.ok(linea.length <= 85);
});

test('sin la opción alEvento todo sigue funcionando igual (el aviso es opcional)', () => {
	Falso.instancias = [];
	const textos = [];
	const voz = new ReconocedorDeVoz({
		ventana: { webkitSpeechRecognition: Falso },
		alTexto: (t) => textos.push(t.texto),
	});
	voz.iniciar();
	Falso.instancias[0].onaudiostart();
	Falso.instancias[0].onresult(resultado('hola'));

	assert.deepEqual(textos, ['hola']);
});
