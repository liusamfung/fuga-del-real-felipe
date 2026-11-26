import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VozDelJuego } from '../src/sistemas/VozDelJuego.js';
import { elegirVoz } from '../src/utilidades/voces.js';

const voz = (lang, extra = {}) => ({ name: `voz ${lang}`, lang, ...extra });

// Un "navegador" falso que anota lo que le piden decir, para probar sin altavoces.
function navegadorFalso({ voces = [] } = {}) {
	const dicho = [];
	let cortes = 0;
	class Frase {
		constructor(texto) {
			this.text = texto;
		}
	}
	return {
		dicho,
		get cortes() {
			return cortes;
		},
		ventana: {
			SpeechSynthesisUtterance: Frase,
			speechSynthesis: {
				speak: (frase) => dicho.push(frase),
				cancel: () => {
					cortes += 1;
				},
				getVoices: () => voces,
			},
		},
	};
}

// --- Elegir la voz ---

test('elegirVoz prefiere el mismo idioma exacto (en-US antes que en-GB)', () => {
	const voces = [voz('es-ES'), voz('en-GB'), voz('en-US'), voz('fr-FR')];
	assert.equal(elegirVoz(voces, 'en-US').lang, 'en-US');
});

test('elegirVoz, sin el idioma exacto, usa otra variante del mismo idioma', () => {
	assert.equal(elegirVoz([voz('es-ES'), voz('en-GB')], 'en-US').lang, 'en-GB');
});

test('elegirVoz entiende "en_US" (Android) igual que "en-US"', () => {
	assert.equal(elegirVoz([voz('es_ES'), voz('en_US')], 'en-US').lang, 'en_US');
});

test('elegirVoz entre varias del mismo idioma prefiere la predeterminada, y si no, la primera', () => {
	const primera = voz('en-US', { name: 'primera' });
	const predeterminada = voz('en-US', { name: 'predeterminada', default: true });
	assert.equal(elegirVoz([primera, predeterminada], 'en-US').name, 'predeterminada');
	assert.equal(elegirVoz([primera, voz('en-US', { name: 'otra' })], 'en-US').name, 'primera');
});

test('elegirVoz devuelve null si no hay ninguna voz de ese idioma o no hay voces', () => {
	assert.equal(elegirVoz([voz('es-ES'), voz('fr-FR')], 'en-US'), null);
	assert.equal(elegirVoz([], 'en-US'), null);
});

// --- La voz del juego ---

test('disponible: solo si el navegador sabe hablar', () => {
	assert.equal(VozDelJuego.disponible(navegadorFalso().ventana), true);
	assert.equal(VozDelJuego.disponible({}), false);
	assert.equal(
		VozDelJuego.disponible({ speechSynthesis: { speak() {} } }),
		false,
		'falta Utterance',
	);
});

test('decir pide hablar con el texto, el idioma y la velocidad', () => {
	const { ventana, dicho } = navegadorFalso();
	const voz = new VozDelJuego({ idioma: 'en-US', velocidad: 0.9, ventana });

	assert.equal(voz.decir('window'), true);
	assert.equal(dicho.length, 1);
	assert.equal(dicho[0].text, 'window');
	assert.equal(dicho[0].lang, 'en-US');
	assert.equal(dicho[0].rate, 0.9);
});

test('decir usa la mejor voz de la lista, y sin voces deja que el navegador elija por el idioma', () => {
	const inglesa = voz('en-US');
	const conVoces = navegadorFalso({ voces: [voz('es-ES'), inglesa] });
	new VozDelJuego({ ventana: conVoces.ventana }).decir('dog');
	assert.equal(conVoces.dicho[0].voice, inglesa);

	const sinVoces = navegadorFalso();
	new VozDelJuego({ ventana: sinVoces.ventana }).decir('dog');
	assert.equal(sinVoces.dicho[0].voice, undefined);
	assert.equal(sinVoces.dicho[0].lang, 'en-US');
});

test('decir corta lo anterior: repetir la palabra no se encima a la primera', () => {
	const navegador = navegadorFalso();
	const voz = new VozDelJuego({ ventana: navegador.ventana });
	voz.decir('window');
	voz.decir('window');
	assert.equal(navegador.cortes, 2, 'se corta antes de cada vez que habla');
	assert.equal(navegador.dicho.length, 2);
});

test('decir devuelve false (y no falla) si el navegador no sabe hablar', () => {
	assert.equal(new VozDelJuego({ ventana: {} }).decir('window'), false);
});

test('alTerminar se llama cuando acaba de hablar', () => {
	const navegador = navegadorFalso();
	let terminado = 0;
	new VozDelJuego({ ventana: navegador.ventana }).decir('cat', {
		alTerminar: () => (terminado += 1),
	});
	navegador.dicho[0].onend();
	assert.equal(terminado, 1);
});

test('alError avisa de los fallos reales pero no de cuando nosotros cortamos la voz', () => {
	const navegador = navegadorFalso();
	const errores = [];
	new VozDelJuego({ ventana: navegador.ventana }).decir('cat', { alError: (e) => errores.push(e) });

	navegador.dicho[0].onerror({ error: 'interrupted' });
	navegador.dicho[0].onerror({ error: 'canceled' });
	assert.deepEqual(errores, [], 'cortarla nosotros no es un error');

	navegador.dicho[0].onerror({ error: 'not-allowed' });
	navegador.dicho[0].onerror({});
	assert.deepEqual(errores, ['not-allowed', 'desconocido']);
});

test('detener calla al juego, y no falla si no puede hablar', () => {
	const navegador = navegadorFalso();
	new VozDelJuego({ ventana: navegador.ventana }).detener();
	assert.equal(navegador.cortes, 1);
	assert.doesNotThrow(() => new VozDelJuego({ ventana: {} }).detener());
});
