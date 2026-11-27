import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/config.js';
import { AUDIOS, claveDeLaMusicaDelNivel } from '../src/datos/audio.js';
import { TIPOS_DE_ENEMIGO } from '../src/datos/enemigos.js';
import { NIVELES } from '../src/datos/niveles.js';
import {
	acercarElVolumen,
	puedeSonar,
	ritmoDeLaMusica,
	variacionDeTono,
} from '../src/utilidades/sonido.js';

// El audio del juego (27/11/2026): los 10 archivos de public/assets/audio, su catálogo y dónde suenan.
const RAIZ = new URL('../', import.meta.url);
const PUBLIC = new URL('public/', RAIZ);

// Los 10 sonidos (los 9 de la primera lista y la muerte del jugador, que se pidió después), con su duración (en segundos) según la lista del usuario.
const PEDIDOS = {
	'musica-nivel-1': [60, 120],
	'musica-nivel-2': [60, 120],
	'jugador-disparo': [0, 0.5],
	'jugador-dano': [0, 1],
	'jugador-muerte': [0.8, 3],
	'guardia-escopeta-disparo': [0, 1],
	'guardia-rifle-disparo': [0, 1],
	'rata-ataque': [0, 1],
	'fantasma-ataque-basico': [0, 1.5],
	'fantasma-ataque-fuerte': [1, 3],
};

// --- Leer un MP3 sin decodificarlo: se recorren sus cuadros (cada uno dura 1152 muestras) ---
const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]; // MPEG 1, capa III (kbps)
const FRECUENCIAS = [44100, 48000, 32000];

function leerMp3(bytes) {
	let posicion = 0;
	if (bytes.toString('latin1', 0, 3) === 'ID3') {
		// Una etiqueta ID3 al principio: su tamaño va en 4 bytes de 7 bits.
		posicion = 10 + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]);
	}

	let cuadros = 0;
	let frecuencia = 0;
	let canales = 0;
	let kbps = 0;
	while (posicion + 4 <= bytes.length) {
		const [b0, b1, b2, b3] = [
			bytes[posicion],
			bytes[posicion + 1],
			bytes[posicion + 2],
			bytes[posicion + 3],
		];
		const esCuadro =
			b0 === 0xff && (b1 & 0xe0) === 0xe0 && ((b1 >> 3) & 3) === 3 && ((b1 >> 1) & 3) === 1;
		const indiceDeBitrate = b2 >> 4;
		const indiceDeFrecuencia = (b2 >> 2) & 3;
		if (!esCuadro || indiceDeBitrate === 0 || indiceDeBitrate === 15 || indiceDeFrecuencia === 3) {
			break;
		}

		kbps = BITRATES[indiceDeBitrate];
		frecuencia = FRECUENCIAS[indiceDeFrecuencia];
		canales = b3 >> 6 === 3 ? 1 : 2;
		posicion += Math.floor((144 * kbps * 1000) / frecuencia) + ((b2 >> 1) & 1);
		cuadros += 1;
	}
	return { cuadros, frecuencia, canales, kbps, segundos: (cuadros * 1152) / (frecuencia || 1) };
}

const archivoDe = (clave) => new URL(AUDIOS[clave].ruta, PUBLIC);

test('el catálogo tiene exactamente los 10 sonidos (los 9 pedidos primero y la muerte del jugador, 2 músicas y 8 efectos), con sus nombres', () => {
	assert.deepEqual(Object.keys(AUDIOS).sort(), Object.keys(PEDIDOS).sort());
});

test('cada sonido es un archivo .mp3 con nombre en minúsculas y guiones, dentro de assets/audio', () => {
	for (const [clave, { ruta }] of Object.entries(AUDIOS)) {
		assert.equal(ruta, `assets/audio/${clave}.mp3`, clave);
		assert.match(clave, /^[a-z0-9-]+$/, clave);
		assert.ok(statSync(archivoDe(clave)).size > 0, `${clave}: el archivo está vacío`);
	}
});

test('cada archivo es un MP3 válido: mono, a 44100 Hz y sin bytes sobrantes', () => {
	for (const clave of Object.keys(AUDIOS)) {
		const bytes = readFileSync(archivoDe(clave));
		const mp3 = leerMp3(bytes);
		assert.ok(mp3.cuadros > 0, `${clave}: no se encontró ningún cuadro de MP3`);
		assert.equal(mp3.frecuencia, 44100, clave);
		assert.equal(mp3.canales, 1, `${clave}: debe ser mono`);
	}
});

test('cada sonido dura lo que se pidió: la música de 1 a 2 minutos y los efectos lo que dice la lista', () => {
	for (const [clave, [minimo, maximo]] of Object.entries(PEDIDOS)) {
		const { segundos } = leerMp3(readFileSync(archivoDe(clave)));
		assert.ok(
			segundos >= minimo && segundos <= maximo,
			`${clave}: ${segundos.toFixed(2)} s, se pedía de ${minimo} a ${maximo}`,
		);
		// Y el catálogo dice lo mismo que la lista (si alguien cambia uno, se cambia el otro).
		assert.deepEqual(
			[AUDIOS[clave].duracion.min <= segundos, AUDIOS[clave].duracion.max >= segundos],
			[true, true],
			clave,
		);
	}
});

test('los archivos pesan poco: ningún efecto pasa de 40 KB ni la música de 2 MB (el repositorio es público)', () => {
	for (const [clave, { tipo }] of Object.entries(AUDIOS)) {
		const kb = statSync(archivoDe(clave)).size / 1024;
		assert.ok(kb <= (tipo === 'musica' ? 2048 : 40), `${clave}: ${kb.toFixed(0)} KB`);
	}
});

test('no hay archivos de audio que el catálogo no conozca (ni nombres mal escritos)', () => {
	const enLaCarpeta = readdirSync(fileURLToPath(new URL('assets/audio/', PUBLIC))).filter((n) =>
		n.endsWith('.mp3'),
	);
	assert.deepEqual(
		enLaCarpeta.sort(),
		Object.keys(AUDIOS)
			.map((c) => `${c}.mp3`)
			.sort(),
	);
});

test('cada entrada del catálogo está completa: tipo, volumen entre 0 y 1 y, si es efecto, separación y variación', () => {
	for (const [clave, datos] of Object.entries(AUDIOS)) {
		assert.ok(['musica', 'efecto'].includes(datos.tipo), clave);
		assert.ok(datos.volumen > 0 && datos.volumen <= 1, `${clave}: volumen ${datos.volumen}`);
		assert.ok(datos.duracion.min >= 0 && datos.duracion.max > datos.duracion.min, clave);
		if (datos.tipo === 'efecto') {
			assert.ok(datos.separacion >= 0 && datos.variacion >= 0, clave);
		}
	}
});

test('la música va más baja que los efectos, para que los golpes y disparos se oigan por encima', () => {
	const efectos = Object.values(AUDIOS).filter((a) => a.tipo === 'efecto');
	const musicas = Object.values(AUDIOS).filter((a) => a.tipo === 'musica');
	assert.ok(
		Math.max(...musicas.map((m) => m.volumen)) < Math.min(...efectos.map((e) => e.volumen)),
	);
});

// --- Dónde suena cada sonido ---

test('cada nivel del juego tiene su música', () => {
	for (const numero of Object.keys(NIVELES)) {
		const clave = claveDeLaMusicaDelNivel(numero);
		assert.equal(AUDIOS[clave]?.tipo, 'musica', `el nivel ${numero} no tiene ${clave}`);
	}
});

test('cada guardia y cada rata usa un efecto que existe: el azul el rifle, el rojo la escopeta, las ratas su ataque', () => {
	assert.equal(TIPOS_DE_ENEMIGO['guardia-azul'].disparo.sonido, 'guardia-rifle-disparo');
	assert.equal(TIPOS_DE_ENEMIGO['guardia-rojo'].disparo.sonido, 'guardia-escopeta-disparo');
	for (const [nombre, tipo] of Object.entries(TIPOS_DE_ENEMIGO)) {
		for (const clave of [tipo.disparo?.sonido, tipo.sonidoDeAtaque].filter(Boolean)) {
			assert.equal(
				AUDIOS[clave]?.tipo,
				'efecto',
				`${nombre}: «${clave}» no es un efecto del catálogo`,
			);
		}
		assert.equal(
			tipo.sonidoDeAtaque,
			nombre.startsWith('rata-') ? 'rata-ataque' : undefined,
			nombre,
		);
	}
});

// Los .js de src/ donde se PIDEN los sonidos. Se dejan fuera el catálogo y el sistema de sonido: ahí los nombres solo
// aparecen en comentarios de ejemplo y contarían como si el juego los pidiera.
// Tampoco los datos de los enemigos (`enemigos.js`): dicen QUÉ suena, pero quien lo pide es el código que los lee.
const NO_CUENTAN = new Set(['audio.js', 'Sonido.js', 'enemigos.js']);
function fuentes(carpeta = new URL('src/', RAIZ)) {
	return readdirSync(fileURLToPath(carpeta), { withFileTypes: true }).flatMap((entrada) =>
		entrada.isDirectory()
			? fuentes(new URL(`${entrada.name}/`, carpeta))
			: entrada.name.endsWith('.js')
				? NO_CUENTAN.has(entrada.name)
					? []
					: [readFileSync(new URL(entrada.name, carpeta), 'utf8')]
				: [],
	);
}

test('todo efecto que el código pide con efecto(...) existe en el catálogo (no hay sonidos mudos por un error de nombre)', () => {
	const codigo = fuentes().join('\n');
	const pedidos = [...codigo.matchAll(/efecto\(\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
	assert.ok(pedidos.length >= 4, 'el código casi no pide efectos');
	for (const clave of pedidos) {
		assert.equal(AUDIOS[clave]?.tipo, 'efecto', `el código pide «${clave}», que no existe`);
	}
});

test('ningún sonido del catálogo queda sin usar: cada uno suena en algún lugar del juego', () => {
	const codigo = fuentes().join('\n');
	const datosDeEnemigos = JSON.stringify(TIPOS_DE_ENEMIGO);
	for (const [clave, { tipo }] of Object.entries(AUDIOS)) {
		const usado =
			tipo === 'musica'
				? Object.keys(NIVELES).some((n) => claveDeLaMusicaDelNivel(n) === clave)
				: codigo.includes(`efecto('${clave}'`) || datosDeEnemigos.includes(`"${clave}"`);
		assert.ok(usado, `«${clave}» no suena en ningún lugar`);
	}
});

test('lo que choca en cada fotograma no se convierte en ruido: las ratas no suenan más de 3 veces por segundo', () => {
	// Una rata sobre el jugador lo toca 60 veces por segundo: sin separación sería un zumbido, no un mordisco.
	assert.ok(AUDIOS['rata-ataque'].separacion >= 300, `${AUDIOS['rata-ataque'].separacion} ms`);
	// Y que ningún efecto se pueda repetir más rápido de lo que dura (se montaría sobre sí mismo).
	assert.ok(AUDIOS['fantasma-ataque-fuerte'].separacion >= 400);
});

test('el código realmente usa los sonidos que traen los datos de los enemigos (si no, estarían escritos pero mudos)', () => {
	const codigo = fuentes().join('\n'); // sin los datos (ver NO_CUENTAN)
	assert.match(
		codigo,
		/\.sonidoDeAtaque\b/,
		'nadie lee `sonidoDeAtaque`: las ratas no suenan al tocar',
	);
	assert.match(
		codigo,
		/disparo\.sonido\b/,
		'nadie lee `disparo.sonido`: los guardias no suenan al disparar',
	);
});

// --- Las cuentas ---

test('un efecto no vuelve a sonar hasta pasada su separación (el borde cuenta como pasada)', () => {
	assert.equal(puedeSonar(undefined, 1000, 350), true, 'la primera vez siempre suena');
	assert.equal(puedeSonar(1000, 1349, 350), false);
	assert.equal(puedeSonar(1000, 1350, 350), true);
	assert.equal(puedeSonar(1000, 1000, 0), true, 'sin separación siempre suena');
});

test('la variación de tono está entre -n y +n centésimas y es 0 si no hay variación', () => {
	assert.equal(
		variacionDeTono(() => 0, 80),
		-80,
	);
	assert.equal(
		variacionDeTono(() => 1, 80),
		80,
	);
	assert.equal(
		variacionDeTono(() => 0.5, 80),
		0,
	);
	assert.equal(
		variacionDeTono(() => 0.3, 0),
		0,
	);
	let azar = 0.01;
	for (let i = 0; i < 200; i += 1) {
		azar = (azar * 7919 + 0.137) % 1;
		const v = variacionDeTono(() => azar, 60);
		assert.ok(v >= -60 && v <= 60, `${v}`);
	}
});

test('la música baja de ritmo en cámara lenta y vuelve a la normalidad, sin salirse de su rango', () => {
	const opciones = { factor: 0.2, minimo: 0.55 };
	assert.equal(ritmoDeLaMusica(1, opciones), 1);
	assert.equal(ritmoDeLaMusica(0.2, opciones), 0.55);
	assert.ok(
		Math.abs(ritmoDeLaMusica(0.6, opciones) - 0.775) < 1e-9,
		'a mitad de camino, a mitad de ritmo',
	);
	assert.equal(ritmoDeLaMusica(5, opciones), 1, 'más rápido que lo normal no acelera la música');
	assert.equal(ritmoDeLaMusica(0, opciones), 0.55, 'ni más lento que la cámara lenta');
});

test('el ritmo de la música en cámara lenta de la configuración es un valor razonable', () => {
	const { MUSICA_EN_CAMARA_LENTA } = CONFIG.AUDIO;
	assert.ok(MUSICA_EN_CAMARA_LENTA > 0.3 && MUSICA_EN_CAMARA_LENTA < 1);
});

// --- El volumen baja mientras se oye la palabra del dictado ---

test('el volumen se acerca al objetivo poco a poco y nunca se pasa de él', () => {
	// Un cambio completo de 0 a 1 tarda 300 ms: en 30 ms se mueve 0,1.
	assert.ok(Math.abs(acercarElVolumen(1, 0.12, 30, 300) - 0.9) < 1e-9, 'baja un paso');
	assert.ok(Math.abs(acercarElVolumen(0.12, 1, 30, 300) - 0.22) < 1e-9, 'sube un paso');
	assert.equal(acercarElVolumen(0.15, 0.12, 300, 300), 0.12, 'no se pasa del objetivo al bajar');
	assert.equal(acercarElVolumen(0.95, 1, 300, 300), 1, 'ni al subir');
	assert.equal(acercarElVolumen(0.5, 0.5, 100, 300), 0.5, 'si ya está, se queda');
	assert.equal(acercarElVolumen(1, 0.12, 10, 0), 0.12, 'sin duración, salta al objetivo');
});

test('de todo el volumen al volumen bajo se llega en la transición configurada, y de vuelta también', () => {
	const { VOLUMEN_EN_EL_DICTADO, TRANSICION_DEL_VOLUMEN } = CONFIG.AUDIO;
	let volumen = 1;
	let ms = 0;
	while (volumen !== VOLUMEN_EN_EL_DICTADO && ms < 5000) {
		volumen = acercarElVolumen(volumen, VOLUMEN_EN_EL_DICTADO, 16, TRANSICION_DEL_VOLUMEN);
		ms += 16;
	}
	assert.equal(volumen, VOLUMEN_EN_EL_DICTADO);
	assert.ok(ms <= TRANSICION_DEL_VOLUMEN + 16, `bajó en ${ms} ms`);

	while (volumen !== 1 && ms < 10000) {
		volumen = acercarElVolumen(volumen, 1, 16, TRANSICION_DEL_VOLUMEN);
		ms += 16;
	}
	assert.equal(volumen, 1, 'vuelve a todo el volumen');
});

test('en el dictado el volumen baja CONSIDERABLEMENTE (a un cuarto o menos) pero no se apaga del todo', () => {
	const { VOLUMEN_EN_EL_DICTADO, TRANSICION_DEL_VOLUMEN } = CONFIG.AUDIO;
	assert.ok(
		VOLUMEN_EN_EL_DICTADO <= 0.25,
		`${VOLUMEN_EN_EL_DICTADO} es poco para oír bien la palabra`,
	);
	assert.ok(VOLUMEN_EN_EL_DICTADO > 0, 'no se apaga: el silencio total sería raro');
	assert.ok(
		TRANSICION_DEL_VOLUMEN >= 100 && TRANSICION_DEL_VOLUMEN <= 1000,
		'la transición no es un corte ni una espera',
	);
});
