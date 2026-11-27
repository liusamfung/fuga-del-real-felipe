// Genera los sonidos y la música del juego (public/assets/audio/*.mp3). Todo se sintetiza aquí con código: no hay
// ningún sonido copiado de otra parte, así que no hay derechos de autor que revisar. Son sonidos PROVISIONALES de
// buena calidad para jugar y probar; si alguien graba o consigue uno mejor, basta con poner su archivo con el mismo
// nombre en public/assets/audio/ (el catálogo está en src/datos/audio.js).
//
//   npm run audio                       genera los 10 archivos
//   npm run audio -- jugador-disparo    genera solo los que se nombren
//
// Necesita `ffmpeg` (con libmp3lame) para pasar de WAV a MP3: `brew install ffmpeg`. Los MP3 ya generados están en el
// repositorio, así que quien no toque los sonidos no necesita nada de esto.
//
// Cómo está hecho: osciladores (seno, cuadrada, sierra, triángulo), ruido blanco con semilla (siempre sale igual),
// filtros de un polo, eco y un mini «tracker» para la música (bajo, arpegio, melodía y batería por compases).

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FS = 44100; // muestras por segundo
const CARPETA_DE_SALIDA = fileURLToPath(new URL('../public/assets/audio/', import.meta.url));
const DOS_PI = 2 * Math.PI;

// ---------------------------------------------------------------------------------------------------------------
// Herramientas básicas
// ---------------------------------------------------------------------------------------------------------------

// Números «al azar» que siempre dan la misma serie: así cada ejecución genera exactamente los mismos archivos.
function azarConSemilla(semilla) {
	let estado = semilla;
	return () => {
		estado = (estado + 0x6d2b79f5) | 0;
		let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const crear = (segundos) => new Float32Array(Math.round(segundos * FS));

/** Suma `origen` dentro de `destino` desde el segundo `inicio`, multiplicado por `ganancia`. */
function mezclar(destino, origen, inicio = 0, ganancia = 1) {
	const desde = Math.round(inicio * FS);
	for (let i = 0; i < origen.length; i += 1) {
		const j = desde + i;
		if (j >= destino.length) {
			break;
		}
		destino[j] += origen[i] * ganancia;
	}
}

// Formas de onda: `fase` va en ciclos (1 = una vuelta entera).
const ONDAS = {
	seno: (fase) => Math.sin(DOS_PI * fase),
	cuadrada: (fase, ancho = 0.5) => (fase % 1 < ancho ? 1 : -1),
	sierra: (fase) => 2 * (fase % 1) - 1,
	triangulo: (fase) => 1 - 4 * Math.abs((fase % 1) - 0.5),
};

/**
 * Un oscilador. `frecuencia` es un número (Hz) o una función del tiempo `(t) => Hz`, para hacer barridos. Con
 * `vibrato: { velocidad, profundidad }` la frecuencia ondula.
 */
function oscilador({ tipo = 'seno', frecuencia, duracion, ancho = 0.5, vibrato = null }) {
	const salida = crear(duracion);
	let fase = 0;
	for (let i = 0; i < salida.length; i += 1) {
		const t = i / FS;
		let f = typeof frecuencia === 'function' ? frecuencia(t) : frecuencia;
		if (vibrato) {
			f *= 1 + vibrato.profundidad * Math.sin(DOS_PI * vibrato.velocidad * t);
		}
		fase += f / FS;
		salida[i] = ONDAS[tipo](fase, ancho);
	}
	return salida;
}

/** Ruido blanco entre -1 y 1. */
function ruido(duracion, azar) {
	const salida = crear(duracion);
	for (let i = 0; i < salida.length; i += 1) {
		salida[i] = azar() * 2 - 1;
	}
	return salida;
}

/** Multiplica la señal por una envolvente `(t) => ganancia`. Modifica y devuelve la misma señal. */
function envolver(senal, envolvente) {
	for (let i = 0; i < senal.length; i += 1) {
		senal[i] *= envolvente(i / FS);
	}
	return senal;
}

/** Filtro pasa bajos de un polo. `corte` es Hz o una función del tiempo. */
function pasaBajos(senal, corte) {
	let y = 0;
	for (let i = 0; i < senal.length; i += 1) {
		const fc = typeof corte === 'function' ? corte(i / FS) : corte;
		const a = 1 - Math.exp((-DOS_PI * fc) / FS);
		y += a * (senal[i] - y);
		senal[i] = y;
	}
	return senal;
}

/** Filtro pasa altos de un polo (la señal menos lo que dejaría pasar un pasa bajos). */
function pasaAltos(senal, corte) {
	const original = Float32Array.from(senal);
	pasaBajos(senal, corte);
	for (let i = 0; i < senal.length; i += 1) {
		senal[i] = original[i] - senal[i];
	}
	return senal;
}

/** Eco: repite el sonido cada `retraso` s, cada vez más bajo (`realimentacion`). Alarga la señal `cola` segundos. */
function eco(senal, retraso, realimentacion, mezcla, cola = 0.3) {
	const salida = crear(senal.length / FS + cola);
	const n = Math.round(retraso * FS);
	const repeticiones = new Float32Array(salida.length);
	for (let i = 0; i < salida.length; i += 1) {
		const entrada = i < senal.length ? senal[i] : 0;
		const anterior = i >= n ? repeticiones[i - n] + (i - n < senal.length ? senal[i - n] : 0) : 0;
		repeticiones[i] = anterior * realimentacion;
		salida[i] = entrada + repeticiones[i] * mezcla * 2;
	}
	return salida;
}

/** Un pequeño fundido al principio y al final, para que no suene un clic al empezar o terminar. */
function fundir(senal, entrada = 0.002, salida = 0.01) {
	const n1 = Math.round(entrada * FS);
	const n2 = Math.round(salida * FS);
	for (let i = 0; i < n1 && i < senal.length; i += 1) {
		senal[i] *= i / n1;
	}
	for (let i = 0; i < n2 && i < senal.length; i += 1) {
		senal[senal.length - 1 - i] *= i / n2;
	}
	return senal;
}

/** Satura suave (como una válvula): evita picos duros y da cuerpo. */
function saturar(senal, empuje = 1.5) {
	for (let i = 0; i < senal.length; i += 1) {
		senal[i] = Math.tanh(senal[i] * empuje);
	}
	return senal;
}

/** Escala la señal para que su valor más alto sea `pico` (1 = el máximo posible). */
function normalizar(senal, pico = 0.9) {
	let maximo = 0;
	for (const muestra of senal) {
		maximo = Math.max(maximo, Math.abs(muestra));
	}
	if (maximo > 0) {
		for (let i = 0; i < senal.length; i += 1) {
			senal[i] *= pico / maximo;
		}
	}
	return senal;
}

const decaimiento = (velocidad) => (t) => Math.exp(-t * velocidad);

// ---------------------------------------------------------------------------------------------------------------
// Efectos de sonido
// ---------------------------------------------------------------------------------------------------------------

// Disparo del jugador: un «pew» corto y agudo que baja de tono. Se oye mucho (cada 0,25 s), así que es suave.
function disparoDelJugador() {
	const azar = azarConSemilla(1);
	const tono = envolver(
		oscilador({
			tipo: 'cuadrada',
			ancho: 0.35,
			frecuencia: (t) => 250 + 1500 * Math.exp(-t * 14),
			duracion: 0.16,
		}),
		decaimiento(22),
	);
	const chasquido = envolver(pasaAltos(ruido(0.04, azar), 2500), decaimiento(120));
	mezclar(tono, chasquido, 0, 0.35);
	return normalizar(fundir(tono), 0.8);
}

// El jugador recibe daño: un quejido que baja de tono con un golpe grave y un soplido.
function danoDelJugador() {
	const azar = azarConSemilla(2);
	const duracion = 0.55;
	const queja = envolver(
		oscilador({
			tipo: 'sierra',
			frecuencia: (t) => 110 + 280 * Math.exp(-t * 7),
			duracion,
			vibrato: { velocidad: 28, profundidad: 0.06 },
		}),
		(t) => Math.min(1, t / 0.005) * Math.exp(-t * 5),
	);
	pasaBajos(queja, 1800);
	const golpe = envolver(
		oscilador({ frecuencia: (t) => 50 + 60 * Math.exp(-t * 14), duracion }),
		decaimiento(10),
	);
	const soplido = envolver(pasaBajos(ruido(duracion, azar), 1400), decaimiento(18));
	const salida = crear(duracion);
	mezclar(salida, queja, 0, 0.75);
	mezclar(salida, golpe, 0, 0.7);
	mezclar(salida, soplido, 0, 0.4);
	return normalizar(fundir(saturar(salida, 1.3)), 0.9);
}

// Muerte del jugador: un golpe grave de impacto y luego tres notas tristes que caen (mi, do, la: «wah, wah, wah») y
// una última, larga, que se hunde con vibrato. Dura ~2,5 s: se oye mientras sale el cartel de «Perdiste».
function muerteDelJugador() {
	const azar = azarConSemilla(8);
	const salida = crear(2.4);
	mezclar(
		salida,
		envolver(
			oscilador({ frecuencia: (t) => 40 + 90 * Math.exp(-t * 14), duracion: 0.5 }),
			decaimiento(7),
		),
		0,
		1,
	);
	mezclar(
		salida,
		envolver(
			pasaBajos(ruido(0.3, azar), (t) => 300 + 3000 * Math.exp(-t * 20)),
			decaimiento(16),
		),
		0,
		0.6,
	);
	for (const { frecuencia, inicio } of [
		{ frecuencia: 329.63, inicio: 0.18 },
		{ frecuencia: 261.63, inicio: 0.52 },
		{ frecuencia: 220, inicio: 0.86 },
	]) {
		const duracion = 0.38;
		const nota = envolver(
			oscilador({
				tipo: 'sierra',
				frecuencia,
				duracion,
				vibrato: { velocidad: 5, profundidad: 0.01 },
			}),
			(t) => Math.min(1, t / 0.01) * Math.min(1, (duracion - t) / 0.08),
		);
		// El «wah»: el filtro se abre al empezar cada nota.
		pasaBajos(nota, (t) => 500 + 1800 * Math.min(1, t / 0.12));
		mezclar(salida, nota, inicio, 0.5);
	}
	const larga = envolver(
		oscilador({
			tipo: 'sierra',
			frecuencia: (t) => 196 * Math.exp(-t * 0.55),
			duracion: 1.2,
			vibrato: { velocidad: 5.5, profundidad: 0.03 },
		}),
		(t) => Math.min(1, t / 0.02) * Math.exp(-t * 1.6),
	);
	pasaBajos(larga, (t) => 200 + 1400 * Math.exp(-t * 1.2));
	mezclar(salida, larga, 1.2, 0.55);
	return normalizar(fundir(saturar(eco(salida, 0.2, 0.4, 0.3, 0.4), 1.2), 0.002, 0.12), 0.9);
}

// Rifle del guardia azul (el tirador): un chasquido seco y cortante con un golpe grave y un eco lejano.
function rifleDelGuardia() {
	const azar = azarConSemilla(3);
	const salida = crear(0.55);
	mezclar(salida, envolver(pasaAltos(ruido(0.14, azar), 1500), decaimiento(48)), 0, 1);
	mezclar(
		salida,
		envolver(
			pasaBajos(ruido(0.4, azar), (t) => 600 + 5400 * Math.exp(-t * 16)),
			decaimiento(15),
		),
		0,
		0.8,
	);
	mezclar(
		salida,
		envolver(
			oscilador({ frecuencia: (t) => 60 + 160 * Math.exp(-t * 30), duracion: 0.3 }),
			decaimiento(12),
		),
		0,
		0.9,
	);
	return normalizar(fundir(saturar(eco(salida, 0.11, 0.35, 0.3, 0.1), 1.6)), 0.9);
}

// Escopeta del guardia rojo (el escopetero): un estallido ancho y pesado con mucha cola, más grave y largo que el rifle.
function escopetaDelGuardia() {
	const azar = azarConSemilla(4);
	const salida = crear(0.85);
	mezclar(
		salida,
		envolver(
			pasaBajos(ruido(0.6, azar), (t) => 400 + 8600 * Math.exp(-t * 8)),
			decaimiento(8),
		),
		0,
		1,
	);
	mezclar(
		salida,
		envolver(
			oscilador({ frecuencia: (t) => 38 + 110 * Math.exp(-t * 18), duracion: 0.6 }),
			decaimiento(6),
		),
		0,
		1.1,
	);
	mezclar(
		salida,
		envolver(pasaBajos(pasaAltos(ruido(0.8, azar), 800), 3000), decaimiento(5)),
		0.04,
		0.25,
	);
	return normalizar(fundir(saturar(eco(salida, 0.09, 0.4, 0.35, 0.05), 1.8)), 0.92);
}

// Ataque de las ratas: dos chillidos agudos y rápidos («chi-chi») con un mordisco de ruido.
function ataqueDeLasRatas() {
	const azar = azarConSemilla(5);
	const salida = crear(0.36);
	for (let k = 0; k < 2; k += 1) {
		const chillido = envolver(
			oscilador({
				frecuencia: (t) => 1800 + 11000 * t,
				duracion: 0.1,
				vibrato: { velocidad: 45, profundidad: 0.03 },
			}),
			(t) => Math.min(1, t / 0.006) * Math.exp(-t * 18),
		);
		mezclar(salida, chillido, k * 0.14, 0.8);
		mezclar(salida, envolver(pasaAltos(ruido(0.05, azar), 3500), decaimiento(70)), k * 0.14, 0.3);
	}
	return normalizar(fundir(salida), 0.8);
}

// Ataque básico del fantasma: un lamento fantasmal que sube y baja con temblor y un soplo, con eco.
function ataqueBasicoDelFantasma() {
	const azar = azarConSemilla(6);
	const duracion = 0.8;
	const lamento = envolver(
		oscilador({
			tipo: 'triangulo',
			frecuencia: (t) => 380 + 520 * Math.sin((Math.PI * t) / duracion),
			duracion,
			vibrato: { velocidad: 6, profundidad: 0.04 },
		}),
		(t) => {
			const sube = Math.min(1, t / 0.08);
			const baja = Math.min(1, (duracion - t) / 0.3);
			return sube * baja * (0.75 + 0.25 * Math.sin(DOS_PI * 12 * t));
		},
	);
	const soplo = envolver(
		pasaBajos(pasaAltos(ruido(duracion, azar), 1200), 2600),
		(t) => Math.sin((Math.PI * t) / duracion) ** 2,
	);
	const salida = crear(duracion);
	mezclar(salida, lamento, 0, 0.8);
	mezclar(salida, soplo, 0, 0.3);
	return normalizar(fundir(eco(salida, 0.17, 0.45, 0.35, 0.2), 0.01, 0.05), 0.85);
}

// Ataque fuerte del fantasma: el rayo verde. Un golpe de energía que baja de tono durante ~2 s, con graves
// profundos y chisporroteo. Suena justo cuando se abre el rayo.
function ataqueFuerteDelFantasma() {
	const azar = azarConSemilla(7);
	const duracion = 2.0;
	const salida = crear(duracion);
	const barrido = (t) => 180 + 1400 * Math.exp(-t * 2.2);
	const envolventeDelRayo = (t) =>
		Math.min(1, t / 0.004) * Math.exp(-t * 0.9) * Math.min(1, (duracion - t) / 0.2);
	for (const desafinado of [0.993, 1, 1.007]) {
		const capa = envolver(
			oscilador({ tipo: 'sierra', frecuencia: (t) => barrido(t) * desafinado, duracion }),
			envolventeDelRayo,
		);
		mezclar(
			salida,
			pasaBajos(capa, (t) => 600 + 5000 * Math.exp(-t * 1.5)),
			0,
			0.3,
		);
	}
	mezclar(
		salida,
		envolver(
			oscilador({ frecuencia: (t) => 45 + 15 * Math.exp(-t * 2), duracion }),
			(t) => envolventeDelRayo(t) * 0.9,
		),
		0,
		0.8,
	);
	// Chisporroteo: ruido agudo que se enciende y se apaga muy rápido.
	const chisporroteo = pasaAltos(ruido(duracion, azar), 3500);
	envolver(chisporroteo, (t) => (Math.sin(DOS_PI * 31 * t) > -0.2 ? 1 : 0.15) * Math.exp(-t * 1.2));
	mezclar(salida, chisporroteo, 0, 0.3);
	// El golpe inicial.
	mezclar(salida, envolver(pasaBajos(ruido(0.1, azar), 5000), decaimiento(60)), 0, 1);
	return normalizar(fundir(saturar(eco(salida, 0.12, 0.35, 0.3, 0.3), 1.4), 0.002, 0.08), 0.9);
}

// ---------------------------------------------------------------------------------------------------------------
// Música: un mini «tracker»
// ---------------------------------------------------------------------------------------------------------------

const NOTAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** El número MIDI de una nota: 'A4' = 69, 'C#5' = 73, 'Bb4' = 70. */
function midi(nombre) {
	const [, letra, alteracion, octava] = nombre.match(/^([A-G])(#|b)?(\d)$/);
	return (
		12 * (Number(octava) + 1) +
		NOTAS[letra] +
		(alteracion === '#' ? 1 : alteracion === 'b' ? -1 : 0)
	);
}

const hertz = (nota) => 440 * 2 ** ((nota - 69) / 12);

/** 'Am' → { raiz: 9, intervalos: [0, 3, 7] }; 'F' → mayor; 'Bb' → raíz si bemol. */
function acorde(nombre) {
	const [, letra, alteracion, menor] = nombre.match(/^([A-G])(#|b)?(m)?$/);
	const raiz = (NOTAS[letra] + (alteracion === '#' ? 1 : alteracion === 'b' ? -1 : 0) + 12) % 12;
	return { raiz, intervalos: menor ? [0, 3, 7] : [0, 4, 7] };
}

/**
 * Toca una nota dentro de `pista`. `ataque` y `liberacion` en segundos; la nota dura `duracion` y luego se apaga en
 * `liberacion`. Con `vibrato` (solo notas largas) la afinación ondula un poco.
 */
function tocar(
	pista,
	{
		tipo,
		ancho = 0.5,
		nota,
		inicio,
		duracion,
		amplitud,
		ataque = 0.005,
		liberacion = 0.05,
		vibrato = 0,
	},
) {
	const frecuencia = hertz(nota);
	const total = duracion + liberacion;
	const desde = Math.round(inicio * FS);
	const cantidad = Math.round(total * FS);
	let fase = 0;
	for (let i = 0; i < cantidad; i += 1) {
		const j = desde + i;
		if (j >= pista.length) {
			break;
		}
		const t = i / FS;
		const vibra = vibrato > 0 && t > 0.12 ? 1 + vibrato * Math.sin(DOS_PI * 5.5 * t) : 1;
		fase += (frecuencia * vibra) / FS;
		let envolvente = Math.min(1, t / ataque);
		if (t > duracion) {
			envolvente *= Math.max(0, 1 - (t - duracion) / liberacion);
		}
		pista[j] += ONDAS[tipo](fase, ancho) * amplitud * envolvente;
	}
}

// Batería sintética: bombo (seno que cae), caja (ruido + tono) y platillo cerrado (ruido agudo).
function bombo(pista, inicio, amplitud) {
	const nota = envolver(
		oscilador({ frecuencia: (t) => 45 + 110 * Math.exp(-t * 28), duracion: 0.22 }),
		decaimiento(16),
	);
	mezclar(pista, nota, inicio, amplitud);
}
function caja(pista, inicio, amplitud, azar) {
	const golpe = envolver(pasaAltos(ruido(0.16, azar), 1400), decaimiento(26));
	const cuerpo = envolver(oscilador({ frecuencia: 190, duracion: 0.12 }), decaimiento(35));
	mezclar(pista, golpe, inicio, amplitud);
	mezclar(pista, cuerpo, inicio, amplitud * 0.6);
}
function platillo(pista, inicio, amplitud, azar) {
	mezclar(pista, envolver(pasaAltos(ruido(0.05, azar), 6000), decaimiento(90)), inicio, amplitud);
}
// Un golpe metálico (para la prisión): ruido filtrado con un tono inarmónico que suena a barrote.
function barrote(pista, inicio, amplitud, azar) {
	const resonancia = envolver(
		oscilador({ tipo: 'cuadrada', frecuencia: 820, duracion: 0.35, ancho: 0.2 }),
		decaimiento(11),
	);
	const choque = envolver(pasaAltos(ruido(0.2, azar), 3000), decaimiento(25));
	mezclar(pista, pasaBajos(resonancia, 3200), inicio, amplitud * 0.5);
	mezclar(pista, choque, inicio, amplitud);
}

/** Convierte un compás escrito como 'E5 - C5 - A4 - B4 C5' en notas con inicio y duración (en pasos de corchea). */
function leerCompas(texto) {
	const notas = [];
	texto.split(/\s+/).forEach((ficha, paso) => {
		if (ficha === '-') {
			if (notas.length > 0 && notas.at(-1).hasta === paso) {
				notas.at(-1).hasta += 1; // prolonga la nota anterior
			}
		} else if (ficha !== '.') {
			notas.push({ nota: midi(ficha), desde: paso, hasta: paso + 1 });
		}
	});
	return notas;
}

/**
 * Compone y toca una canción entera. `partes` es la lista de secciones; cada sección tiene `acordes` (uno por
 * compás) y `melodia` (un compás de ocho corcheas por compás). Devuelve la señal lista para repetirse en bucle: lo que
 * suena después del último compás se suma al principio, así el final enlaza con el comienzo sin salto.
 */
function componer(cancion) {
	const azar = azarConSemilla(cancion.semilla);
	const corchea = 60 / cancion.bpm / 2;
	const compas = corchea * 8;
	const compases = cancion.partes.flatMap((parte) =>
		parte.acordes.map((acordeDelCompas, i) => ({
			acordeDelCompas,
			melodia: parte.melodia[i],
			parte,
		})),
	);
	const duracionDeLaCancion = compases.length * compas;
	const cola = 2.5;
	const melodiaPista = crear(duracionDeLaCancion + cola);
	const acompanamiento = crear(duracionDeLaCancion + cola);
	const bateria = crear(duracionDeLaCancion + cola);

	compases.forEach(({ acordeDelCompas, melodia }, numero) => {
		const inicio = numero * compas;
		const { raiz, intervalos } = acorde(acordeDelCompas);
		const bajoBase = 36 + raiz; // do 2 + la raíz
		const arpegioBase = 48 + raiz; // do 3 + la raíz
		const tonos = [0, intervalos[1], intervalos[2], 12];

		// Bajo: según el patrón de la canción (R = raíz, O = octava, 5 = quinta, . = silencio).
		cancion.bajo.patron.split(/\s+/).forEach((paso, i) => {
			const salto = { R: 0, O: 12, 5: 7 }[paso];
			if (salto === undefined) {
				return;
			}
			tocar(acompanamiento, {
				...cancion.bajo,
				nota: bajoBase + salto,
				inicio: inicio + i * corchea,
				duracion: corchea * 0.85,
				liberacion: 0.04,
			});
		});

		// Arpegio: las notas del acorde una tras otra.
		cancion.arpegio.patron.forEach((indice, i) => {
			tocar(acompanamiento, {
				...cancion.arpegio,
				nota: arpegioBase + tonos[indice],
				inicio: inicio + i * corchea,
				duracion: corchea * 0.7,
				liberacion: 0.03,
			});
		});

		// Melodía.
		for (const { nota, desde, hasta } of leerCompas(melodia)) {
			const larga = hasta - desde >= 3;
			tocar(melodiaPista, {
				...cancion.melodia,
				nota,
				inicio: inicio + desde * corchea,
				duracion: (hasta - desde) * corchea * 0.92,
				liberacion: 0.06,
				vibrato: larga ? 0.006 : 0,
			});
		}

		// Batería.
		const ultimo = numero === compases.length - 1;
		cancion.bateria.bombo.forEach((paso) => bombo(bateria, inicio + paso * corchea, 0.7));
		cancion.bateria.caja.forEach((paso) => caja(bateria, inicio + paso * corchea, 0.32, azar));
		for (let paso = 0; paso < 8; paso += 1) {
			platillo(bateria, inicio + paso * corchea, paso % 2 === 0 ? 0.13 : 0.07, azar);
		}
		// Al cierre de cada sección, un redoble en las dos últimas corcheas.
		const cierraSeccion = (numero + 1) % 8 === 0;
		if (cierraSeccion || ultimo) {
			caja(bateria, inicio + 6 * corchea, 0.3, azar);
			caja(bateria, inicio + 7 * corchea, 0.4, azar);
		}
		if (cancion.bateria.metal && numero % 4 === 0) {
			barrote(bateria, inicio, 0.25, azar);
		}
	});

	// Un eco sincronizado con el tempo (tres corcheas) le da espacio a la melodía y al arpegio.
	const conEco = eco(melodiaPista, corchea * 3, 0.4, 0.28, 0);
	const arpegioConEco = eco(acompanamiento, corchea * 3, 0.3, 0.15, 0);
	const mezcla = crear(duracionDeLaCancion + cola);
	mezclar(mezcla, conEco, 0, 1);
	mezclar(mezcla, arpegioConEco, 0, 1);
	mezclar(mezcla, bateria, 0, 1);

	// Bucle sin salto: el final (la cola) se suma al principio.
	const salida = crear(duracionDeLaCancion);
	for (let i = 0; i < salida.length; i += 1) {
		salida[i] = mezcla[i] + (mezcla[salida.length + i] ?? 0);
	}
	// Primero se baja la mezcla (varias voces juntas suman mucho) y solo después se satura un poco: si no, la música
	// sale plana y áspera. Un pico de 0,5 antes de saturar conserva la dinámica.
	normalizar(salida, 0.5);
	saturar(salida, 1.2);
	// Sin fundido al principio ni al final: en un bucle crearía una microcaída en cada vuelta.
	return normalizar(salida, 0.8);
}

// Nivel 1 — «Mazmorras inferiores»: la menor, 92 pulsos por minuto, oscura y lenta. 32 compases (~83 s):
// A, A con la melodía una octava arriba, B y A otra vez con otro final.
const A1 = {
	acordes: ['Am', 'Am', 'F', 'F', 'C', 'C', 'G', 'E'],
	melodia: [
		'E5 - C5 - A4 - B4 C5',
		'D5 - B4 - G4 - A4 -',
		'C5 - A4 - F4 - G4 A4',
		'G4 - A4 - C5 - A4 -',
		'E5 - G5 - E5 - D5 C5',
		'D5 - E5 - C5 - G4 -',
		'B4 - D5 - G5 - D5 B4',
		'G#4 - B4 - E5 - D5 B4',
	],
};
const A1_ALTA = {
	acordes: A1.acordes,
	melodia: [
		'E6 - C6 - A5 - B5 C6',
		'D6 - B5 - G5 - A5 -',
		'C6 - A5 - F5 - G5 A5',
		'G5 - A5 - C6 - A5 -',
		'E6 - G6 - E6 - D6 C6',
		'D6 - E6 - C6 - G5 -',
		'B5 - D6 - G6 - D6 B5',
		'G#5 - B5 - E6 - - - -',
	],
};
const B1 = {
	acordes: ['F', 'F', 'G', 'G', 'Am', 'Am', 'E', 'E'],
	melodia: [
		'A4 C5 F5 - E5 C5 A4 -',
		'G4 A4 C5 - A4 F4 - -',
		'B4 D5 G5 - D5 - B4 -',
		'A4 B4 D5 - B4 G4 - -',
		'C5 E5 A5 - G5 E5 C5 -',
		'B4 C5 E5 - C5 A4 - -',
		'B4 E5 G#5 - E5 B4 G#4 -',
		'A4 B4 G#4 - E4 - - -',
	],
};
const MUSICA_NIVEL_1 = {
	semilla: 11,
	bpm: 92,
	partes: [A1, A1_ALTA, B1, { ...A1, melodia: [...A1.melodia.slice(0, 7), 'G#4 - B4 - E5 - - -'] }],
	bajo: { tipo: 'triangulo', amplitud: 0.55, patron: 'R . R . O . 5 .' },
	arpegio: { tipo: 'cuadrada', ancho: 0.25, amplitud: 0.09, patron: [0, 2, 3, 2, 0, 2, 3, 2] },
	melodia: { tipo: 'cuadrada', ancho: 0.5, amplitud: 0.17 },
	bateria: { bombo: [0, 4], caja: [2, 6] },
};

// Nivel 2 — «Prisión»: re menor, 120 pulsos por minuto, más tensa: bajo que late a corcheas, golpes de barrote y una
// melodía sincopada. 32 compases (64 s).
const A2 = {
	acordes: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A'],
	melodia: [
		'D5 - F5 - A5 - G5 F5',
		'E5 - D5 - C5 - D5 -',
		'Bb4 - D5 - F5 - D5 Bb4',
		'C#5 - E5 - A5 - G5 E5',
		'F5 - A5 - D6 - C6 A5',
		'G5 - F5 - E5 - D5 -',
		'Bb4 - D5 - G5 - F5 D5',
		'C#5 - E5 - A5 - E5 C#5',
	],
};
const A2_SINCOPADA = {
	acordes: A2.acordes,
	melodia: [
		'D5 . F5 A5 - . G5 F5',
		'E5 . D5 C5 - . D5 -',
		'Bb4 . D5 F5 - . D5 Bb4',
		'C#5 . E5 A5 - G5 F5 E5',
		'F5 . A5 D6 - . C6 A5',
		'G5 . F5 E5 - . D5 -',
		'Bb4 . D5 G5 - . F5 D5',
		'A5 - G5 - F5 - E5 C#5',
	],
};
const B2 = {
	acordes: ['Bb', 'Bb', 'C', 'C', 'Dm', 'A', 'Dm', 'A'],
	melodia: [
		'D5 - F5 - Bb5 - A5 F5',
		'G5 - F5 - D5 - F5 -',
		'E5 - G5 - C6 - Bb5 G5',
		'A5 - G5 - E5 - G5 -',
		'F5 - A5 - D6 - A5 F5',
		'E5 - C#5 - E5 - A5 -',
		'D6 - C6 - A5 - F5 -',
		'E5 - C#5 - A4 - C#5 E5',
	],
};
const MUSICA_NIVEL_2 = {
	semilla: 22,
	bpm: 120,
	partes: [
		A2,
		A2_SINCOPADA,
		B2,
		{ ...A2, melodia: [...A2.melodia.slice(0, 7), 'C#5 - E5 - A5 - - -'] },
	],
	bajo: { tipo: 'cuadrada', ancho: 0.25, amplitud: 0.4, patron: 'R R O R R O 5 R' },
	arpegio: { tipo: 'sierra', amplitud: 0.06, patron: [0, 1, 2, 3, 2, 1, 2, 1] },
	melodia: { tipo: 'cuadrada', ancho: 0.3, amplitud: 0.17 },
	bateria: { bombo: [0, 3, 4, 6], caja: [2, 6], metal: true },
};

// ---------------------------------------------------------------------------------------------------------------
// El catálogo de lo que se genera, y la codificación a MP3
// ---------------------------------------------------------------------------------------------------------------

// `kbps`: la calidad del MP3 (los efectos son cortos y pesan poco; la música más). Todo en mono.
const SONIDOS = {
	'musica-nivel-1': { generar: () => componer(MUSICA_NIVEL_1), kbps: 96 },
	'musica-nivel-2': { generar: () => componer(MUSICA_NIVEL_2), kbps: 96 },
	'jugador-disparo': { generar: disparoDelJugador, kbps: 64 },
	'jugador-dano': { generar: danoDelJugador, kbps: 64 },
	'jugador-muerte': { generar: muerteDelJugador, kbps: 64 },
	'guardia-escopeta-disparo': { generar: escopetaDelGuardia, kbps: 64 },
	'guardia-rifle-disparo': { generar: rifleDelGuardia, kbps: 64 },
	'rata-ataque': { generar: ataqueDeLasRatas, kbps: 64 },
	'fantasma-ataque-basico': { generar: ataqueBasicoDelFantasma, kbps: 64 },
	'fantasma-ataque-fuerte': { generar: ataqueFuerteDelFantasma, kbps: 64 },
};

/** Un archivo WAV de 16 bits, mono, a 44100 Hz. */
function aWav(senal) {
	const datos = Buffer.alloc(44 + senal.length * 2);
	datos.write('RIFF', 0);
	datos.writeUInt32LE(36 + senal.length * 2, 4);
	datos.write('WAVEfmt ', 8);
	datos.writeUInt32LE(16, 16);
	datos.writeUInt16LE(1, 20); // PCM
	datos.writeUInt16LE(1, 22); // mono
	datos.writeUInt32LE(FS, 24);
	datos.writeUInt32LE(FS * 2, 28);
	datos.writeUInt16LE(2, 32);
	datos.writeUInt16LE(16, 34);
	datos.write('data', 36);
	datos.writeUInt32LE(senal.length * 2, 40);
	for (let i = 0; i < senal.length; i += 1) {
		datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, senal[i])) * 32767), 44 + i * 2);
	}
	return datos;
}

/**
 * Para la música en bucle: cuánto salta la señal entre la última muestra y la primera, comparado con lo que varía entre
 * dos muestras seguidas en el resto de la canción. Si es mucho más, al volver al principio se oiría un «clic».
 */
function saltoDelBucle(senal) {
	let suma = 0;
	for (let i = 1; i < senal.length; i += 1) {
		suma += (senal[i] - senal[i - 1]) ** 2;
	}
	const variacionTipica = Math.sqrt(suma / (senal.length - 1));
	return Math.abs(senal[0] - senal.at(-1)) / variacionTipica;
}

function estadisticas(senal) {
	let pico = 0;
	let suma = 0;
	for (const muestra of senal) {
		pico = Math.max(pico, Math.abs(muestra));
		suma += muestra * muestra;
	}
	const rms = Math.sqrt(suma / senal.length);
	const db = (x) => (20 * Math.log10(x || 1e-9)).toFixed(1);
	return { segundos: (senal.length / FS).toFixed(2), picoDb: db(pico), rmsDb: db(rms) };
}

function main() {
	const pedidos = process.argv.slice(2);
	const nombres = pedidos.length > 0 ? pedidos : Object.keys(SONIDOS);
	for (const nombre of nombres) {
		if (!SONIDOS[nombre]) {
			console.error(`No existe «${nombre}». Los que hay: ${Object.keys(SONIDOS).join(', ')}`);
			process.exitCode = 1;
			return;
		}
	}

	mkdirSync(CARPETA_DE_SALIDA, { recursive: true });
	const temporal = mkdtempSync(join(tmpdir(), 'fuga-audio-'));
	try {
		for (const nombre of nombres) {
			const { generar, kbps } = SONIDOS[nombre];
			const senal = generar();
			const wav = join(temporal, `${nombre}.wav`);
			const mp3 = join(CARPETA_DE_SALIDA, `${nombre}.mp3`);
			writeFileSync(wav, aWav(senal));
			execFileSync(
				'ffmpeg',
				[
					'-y',
					'-loglevel',
					'error',
					'-i',
					wav,
					'-ac',
					'1',
					'-codec:a',
					'libmp3lame',
					'-b:a',
					`${kbps}k`,
					mp3,
				],
				{ stdio: 'inherit' },
			);
			const { segundos, picoDb, rmsDb } = estadisticas(senal);
			const kb = (statSync(mp3).size / 1024).toFixed(0);
			const bucle = nombre.startsWith('musica')
				? `   unión del bucle ${saltoDelBucle(senal).toFixed(1)}× lo normal`
				: '';
			console.log(
				`${nombre.padEnd(26)} ${segundos.padStart(6)} s   pico ${picoDb} dB   rms ${rmsDb} dB   ${kb} KB${bucle}`,
			);
		}
	} finally {
		rmSync(temporal, { recursive: true, force: true });
	}
}

main();
