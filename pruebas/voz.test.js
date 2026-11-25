import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NOMBRES_DE_LETRAS } from '../src/datos/nombresDeLetras.js';
import { AcumuladorDeVoz } from '../src/sistemas/AcumuladorDeVoz.js';
import { Deletreo } from '../src/sistemas/Deletreo.js';
import { ReconocedorDeVoz } from '../src/sistemas/ReconocedorDeVoz.js';
import { tiempoParaLaPalabra } from '../src/utilidades/deletreo.js';
import { letrasDeLoDicho, normalizarTexto } from '../src/utilidades/voz.js';

const planas = (texto) => letrasDeLoDicho(texto).letras.map((candidatas) => candidatas.join('/'));

// --- Texto y letras ---

test('normalizarTexto quita tildes, signos y espacios de más, pero conserva la ñ', () => {
	assert.equal(normalizarTexto('  ¡Efe,  É! '), 'efe e');
	assert.equal(normalizarTexto('EÑE'), 'eñe');
	assert.equal(normalizarTexto(undefined), '');
	assert.equal(normalizarTexto(42), '');
});

test('se entienden los nombres de las letras del español', () => {
	assert.deepEqual(planas('efe e ere ere o ce a ere ere i ele'), [
		'F',
		'E',
		'R',
		'R',
		'O',
		'C',
		'A',
		'R',
		'R',
		'I',
		'L',
	]);
});

test('el reconocedor a veces escribe las letras sueltas: también valen', () => {
	assert.deepEqual(planas('F E R R O'), ['F', 'E', 'R', 'R', 'O']);
});

test('la eñe no se confunde con la ene', () => {
	assert.deepEqual(planas('ca ñ ó ene'), ['K', 'Ñ', 'O', 'N']);
	assert.deepEqual(planas('eñe ene'), ['Ñ', 'N']);
});

test('los nombres de dos palabras ganan a los de una', () => {
	assert.deepEqual(planas('doble ve i griega'), ['W', 'Y']);
	assert.deepEqual(planas('i i griega i'), ['I', 'Y', 'I'], 'la i sola sigue siendo i');
});

test('la B y la V suenan igual: "be" y "ve" valen para las dos letras', () => {
	assert.deepEqual(planas('be'), ['B/V']);
	assert.deepEqual(planas('ve'), ['B/V']);
	assert.deepEqual(planas('be larga'), ['B']);
	assert.deepEqual(planas('ve corta'), ['V']);
	assert.deepEqual(planas('uve'), ['V']);
});

test('lo que no es el nombre de una letra se ignora y queda anotado', () => {
	const { letras, desconocidas } = letrasDeLoDicho('efe ferrocarril e');
	assert.deepEqual(letras, [['F'], ['E']]);
	assert.deepEqual(desconocidas, ['ferrocarril']);
});

test('un texto vacío no da letras', () => {
	assert.deepEqual(letrasDeLoDicho('').letras, []);
	assert.deepEqual(letrasDeLoDicho('   ').letras, []);
});

test('devolver las candidatas no deja modificar la tabla', () => {
	const [candidatas] = letrasDeLoDicho('be').letras;
	candidatas.push('Z');

	assert.deepEqual(NOMBRES_DE_LETRAS.be, ['B', 'V']);
	assert.deepEqual(letrasDeLoDicho('be').letras, [['B', 'V']]);
});

test('cada letra del alfabeto español tiene al menos un nombre', () => {
	const alfabeto = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];
	const cubiertas = new Set(Object.values(NOMBRES_DE_LETRAS).flat());

	assert.deepEqual(
		alfabeto.filter((letra) => !cubiertas.has(letra)),
		[],
	);
});

// --- Acumulador ---

test('el acumulador entrega cada letra una sola vez aunque el resultado crezca', () => {
	const acumulador = new AcumuladorDeVoz({ retenerUltima: false });

	assert.deepEqual(acumulador.procesar(0, 'efe', false), [['F']]);
	assert.deepEqual(acumulador.procesar(0, 'efe e', false), [['E']]);
	assert.deepEqual(acumulador.procesar(0, 'efe e', false), [], 'repetido: nada nuevo');
	assert.deepEqual(acumulador.procesar(0, 'efe e ere', true), [['R']]);
});

test('reteniendo la última, un resultado provisional entrega todas menos la última', () => {
	const acumulador = new AcumuladorDeVoz({ retenerUltima: true });

	assert.deepEqual(acumulador.procesar(0, 'efe', false), []);
	assert.deepEqual(acumulador.procesar(0, 'efe e', false), [['F']]);
	assert.deepEqual(
		acumulador.procesar(0, 'efe e ere', true),
		[['E'], ['R']],
		'al final salen todas',
	);
});

test('si el navegador corrige la última letra retenida, vale la corregida', () => {
	const acumulador = new AcumuladorDeVoz({ retenerUltima: true });

	assert.deepEqual(acumulador.procesar(0, 'efe de', false), [['F']]);
	assert.deepEqual(
		acumulador.procesar(0, 'efe e', true),
		[['E']],
		'la "de" provisional se corrigió',
	);
});

test('un resultado que se acorta no vuelve a entregar letras ya entregadas', () => {
	const acumulador = new AcumuladorDeVoz({ retenerUltima: false });

	assert.deepEqual(acumulador.procesar(0, 'efe e ere', false), [['F'], ['E'], ['R']]);
	assert.deepEqual(acumulador.procesar(0, 'efe e', true), []);
});

test('cada resultado lleva su propia cuenta, y reiniciar empieza de cero', () => {
	const acumulador = new AcumuladorDeVoz({ retenerUltima: false });

	assert.deepEqual(acumulador.procesar(0, 'efe', true), [['F']]);
	assert.deepEqual(acumulador.procesar(1, 'e', true), [['E']]);
	acumulador.reiniciar();
	assert.deepEqual(acumulador.procesar(0, 'efe', true), [['F']]);
});

// --- Con el deletreo ---

const crearDeletreo = (palabra) => {
	const deletreo = new Deletreo({ palabra, tiempoTotal: 5000, erroresPermitidos: 0 });
	deletreo.empezar(0);
	return deletreo;
};

test('"be" acierta una B y también una V; una letra equivocada sigue siendo error', () => {
	assert.equal(crearDeletreo('B').escribir(['B', 'V'], 10), 'acierto');
	assert.equal(crearDeletreo('V').escribir(['B', 'V'], 10), 'acierto');
	assert.equal(crearDeletreo('C').escribir(['B', 'V'], 10), 'error');
});

test('una lista sin letras válidas se ignora, y una letra suelta sigue funcionando', () => {
	const deletreo = crearDeletreo('RODIL');

	assert.equal(deletreo.escribir([], 10), 'ignorada');
	assert.equal(deletreo.escribir(['1', ' '], 10), 'ignorada');
	assert.equal(deletreo.escribir('r', 10), 'acierto');
});

test('FERROCARRIL dicho en voz se completa de principio a fin', () => {
	const deletreo = new Deletreo({ palabra: 'FERROCARRIL', tiempoTotal: 20000 });
	deletreo.empezar(0);
	const { letras } = letrasDeLoDicho('efe e ere ere o ce a ere ere i ele');

	for (const candidatas of letras) {
		deletreo.escribir(candidatas, 100);
	}
	assert.equal(deletreo.estado, 'acertada');
	assert.equal(deletreo.errores, 0);
});

test('la voz recibe más tiempo con el factor, y el factor se combina con el del revés', () => {
	const tiempos = { base: 1500, porLetra: 400, factorInvertida: 1.5, factor: 1.5 };

	assert.equal(tiempoParaLaPalabra(5, tiempos), 5250);
	assert.equal(tiempoParaLaPalabra(5, tiempos, true), 7875);
	assert.equal(
		tiempoParaLaPalabra(5, { base: 1500, porLetra: 400 }),
		3500,
		'sin factor, igual que antes',
	);
});

// --- Envoltorio del navegador (con un reconocimiento falso) ---

class ReconocimientoFalso {
	static instancias = [];
	static falloAlIniciar = null;

	constructor() {
		ReconocimientoFalso.instancias.push(this);
		this.iniciado = false;
		this.abortado = false;
	}

	start() {
		if (ReconocimientoFalso.falloAlIniciar) {
			throw ReconocimientoFalso.falloAlIniciar;
		}
		this.iniciado = true;
		this.onstart?.();
	}

	abort() {
		this.abortado = true;
	}
}

const resultado = (texto, esFinal = false) => {
	const lista = [
		{ transcript: texto, confidence: 0.9 },
		{ transcript: `${texto}!`, confidence: 0.4 },
	];
	lista.isFinal = esFinal;
	return lista;
};
const evento = (resultados, resultIndex = 0) => ({ resultIndex, results: resultados });
const esperarUnPoco = () => new Promise((listo) => setTimeout(listo, 15));

const crearReconocedor = (opciones = {}) => {
	ReconocimientoFalso.instancias = [];
	ReconocimientoFalso.falloAlIniciar = null;
	const registro = { letras: [], textos: [], estados: [], errores: [] };
	const voz = new ReconocedorDeVoz({
		ventana: { webkitSpeechRecognition: ReconocimientoFalso },
		esperaDeReinicio: 0,
		retenerUltima: false,
		alLetras: (letras) => registro.letras.push(...letras),
		alTexto: (texto) => registro.textos.push(texto),
		alEstado: (estado) => registro.estados.push(estado),
		alError: (codigo, grave) => registro.errores.push([codigo, grave]),
		...opciones,
	});
	return { voz, registro, actual: () => ReconocimientoFalso.instancias.at(-1) };
};

test('disponible() dice si el navegador tiene reconocimiento de voz', () => {
	assert.equal(ReconocedorDeVoz.disponible({}), false);
	assert.equal(ReconocedorDeVoz.disponible({ webkitSpeechRecognition: class {} }), true);
	assert.equal(ReconocedorDeVoz.disponible({ SpeechRecognition: class {} }), true);
});

test('sin soporte, iniciar avisa con un error grave y no hace nada más', () => {
	const registro = [];
	const voz = new ReconocedorDeVoz({ ventana: {}, alError: (c, g) => registro.push([c, g]) });

	assert.equal(voz.iniciar(), false);
	assert.deepEqual(registro, [['no-soportado', true]]);
});

test('se configura para hablar en español, sin cortarse y con resultados provisionales', () => {
	const { voz, actual } = crearReconocedor({ idioma: 'es-PE' });
	voz.iniciar();

	assert.equal(actual().lang, 'es-PE');
	assert.equal(actual().continuous, true);
	assert.equal(actual().interimResults, true);
	assert.equal(actual().iniciado, true);
});

test('lo que oye el reconocedor llega como texto y como letras nuevas', () => {
	const { voz, registro, actual } = crearReconocedor();
	voz.iniciar();

	actual().onresult(evento([resultado('efe')]));
	actual().onresult(evento([resultado('efe e')]));
	actual().onresult(evento([resultado('efe e ere', true)]));

	assert.deepEqual(registro.letras, [['F'], ['E'], ['R']]);
	assert.equal(registro.textos.length, 3);
	assert.equal(registro.textos[0].alternativas.length, 2, 'también manda las alternativas');
	assert.equal(registro.textos[2].esFinal, true);
});

test('solo se leen los resultados nuevos (desde resultIndex)', () => {
	const { voz, registro, actual } = crearReconocedor();
	voz.iniciar();

	actual().onresult(evento([resultado('efe', true)]));
	actual().onresult(evento([resultado('efe', true), resultado('e')], 1));

	assert.deepEqual(registro.letras, [['F'], ['E']]);
});

test('si Chrome corta el reconocimiento por un silencio, se reinicia solo', async () => {
	const { voz, registro } = crearReconocedor();
	voz.iniciar();
	const primero = ReconocimientoFalso.instancias[0];

	primero.onend();
	await esperarUnPoco();

	assert.equal(ReconocimientoFalso.instancias.length, 2);
	assert.equal(ReconocimientoFalso.instancias[1].iniciado, true);
	assert.deepEqual(registro.estados, ['escuchando', 'detenido', 'escuchando']);
});

test('al reiniciar, las letras de la sesión nueva no se confunden con las de la vieja', async () => {
	const { voz, registro } = crearReconocedor();
	voz.iniciar();
	ReconocimientoFalso.instancias[0].onresult(evento([resultado('efe', true)]));
	ReconocimientoFalso.instancias[0].onend();
	await esperarUnPoco();

	ReconocimientoFalso.instancias[1].onresult(evento([resultado('efe', true)]));

	assert.deepEqual(registro.letras, [['F'], ['F']], 'la segunda F es una letra nueva');
});

test('detener corta el reconocimiento, no reinicia y descarta lo que llegue tarde', async () => {
	const { voz, registro } = crearReconocedor();
	voz.iniciar();
	const primero = ReconocimientoFalso.instancias[0];

	voz.detener();
	primero.onresult(evento([resultado('efe', true)]));
	primero.onend();
	await esperarUnPoco();

	assert.equal(primero.abortado, true);
	assert.equal(ReconocimientoFalso.instancias.length, 1);
	assert.deepEqual(registro.letras, []);
});

test('un error grave (sin permiso) se avisa y no se reintenta', async () => {
	const { voz, registro, actual } = crearReconocedor();
	voz.iniciar();

	actual().onerror({ error: 'not-allowed' });
	actual().onend();
	await esperarUnPoco();

	assert.deepEqual(registro.errores, [['not-allowed', true]]);
	assert.equal(ReconocimientoFalso.instancias.length, 1, 'no vuelve a intentarlo');
});

test('no oír nada o cortar nosotros mismos no es un error que avisar', () => {
	const { voz, registro, actual } = crearReconocedor();
	voz.iniciar();

	actual().onerror({ error: 'no-speech' });
	actual().onerror({ error: 'aborted' });

	assert.deepEqual(registro.errores, []);
});

test('si el navegador no deja iniciar, se avisa con un error grave', () => {
	const { voz, registro } = crearReconocedor();
	ReconocimientoFalso.falloAlIniciar = Object.assign(new Error('x'), { name: 'InvalidStateError' });

	assert.equal(voz.iniciar(), false);
	assert.deepEqual(registro.errores, [['InvalidStateError', true]]);
});
