import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { RECURSOS } from '../src/datos/recursos.js';
import { Dash } from '../src/sistemas/Dash.js';
import { distanciaALaLinea, ladoDeEsquive, largoHastaElBorde } from '../src/utilidades/rayo.js';

// El rayo del ataque fuerte del jefe: hasta dónde llega y hacia qué lado se esquiva. Son funciones puras. Las
// medidas son las de una sala de 800 × 640 con paredes de 32: el interior es el rectángulo (32, 32, 736, 576).
const INTERIOR = { x: 32, y: 32, ancho: 736, alto: 576 };
const CENTRO = { x: 400, y: 320 };

test('el rayo llega hasta la pared en las cuatro direcciones', () => {
	assert.equal(largoHastaElBorde(CENTRO, { x: 1, y: 0 }, INTERIOR), 368); // 768 - 400
	assert.equal(largoHastaElBorde(CENTRO, { x: -1, y: 0 }, INTERIOR), 368); // 400 - 32
	assert.equal(largoHastaElBorde(CENTRO, { x: 0, y: 1 }, INTERIOR), 288); // 608 - 320
	assert.equal(largoHastaElBorde(CENTRO, { x: 0, y: -1 }, INTERIOR), 288); // 320 - 32
});

test('en diagonal, el rayo se detiene en la primera pared que toca', () => {
	const diagonal = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
	// Hacia abajo y a la derecha toca primero el suelo (288 px hacia abajo) y no la pared derecha (368).
	assert.ok(Math.abs(largoHastaElBorde(CENTRO, diagonal, INTERIOR) - 288 / Math.SQRT1_2) < 1e-9);

	// Con la y pegada al suelo toca primero la pared derecha.
	const bajo = { x: 400, y: 600 };
	assert.ok(Math.abs(largoHastaElBorde(bajo, diagonal, INTERIOR) - 8 / Math.SQRT1_2) < 1e-9);
	const derecha = { x: 700, y: 100 };
	assert.ok(Math.abs(largoHastaElBorde(derecha, diagonal, INTERIOR) - 68 / Math.SQRT1_2) < 1e-9);
});

test('el punto final del rayo cae justo en el borde de la sala', () => {
	for (const grados of [0, 20, 45, 90, 135, 200, 270, 315]) {
		const radianes = (grados * Math.PI) / 180;
		const direccion = { x: Math.cos(radianes), y: Math.sin(radianes) };
		const largo = largoHastaElBorde(CENTRO, direccion, INTERIOR);
		const final = { x: CENTRO.x + direccion.x * largo, y: CENTRO.y + direccion.y * largo };

		const enElBorde =
			Math.abs(final.x - 32) < 1e-6 ||
			Math.abs(final.x - 768) < 1e-6 ||
			Math.abs(final.y - 32) < 1e-6 ||
			Math.abs(final.y - 608) < 1e-6;
		assert.ok(enElBorde, `${grados}°: termina en (${final.x}, ${final.y})`);
		assert.ok(
			final.x >= 32 - 1e-6 &&
				final.x <= 768 + 1e-6 &&
				final.y >= 32 - 1e-6 &&
				final.y <= 608 + 1e-6,
		);
	}
});

test('sin dirección, o con el origen fuera de la sala, el largo es 0 (no es infinito ni negativo)', () => {
	assert.equal(largoHastaElBorde(CENTRO, { x: 0, y: 0 }, INTERIOR), 0);
	assert.equal(largoHastaElBorde({ x: 900, y: 320 }, { x: 1, y: 0 }, INTERIOR), 0);
});

test('se esquiva hacia el lado con más espacio, perpendicular al rayo', () => {
	// El rayo va hacia la derecha; el jugador está cerca del suelo: hay más espacio hacia arriba.
	const cercaDelSuelo = { x: 600, y: 560 };
	assert.deepEqual(ladoDeEsquive({ x: 1, y: 0 }, cercaDelSuelo, INTERIOR), { x: 0, y: -1 });
	// Cerca del techo: hacia abajo.
	const cercaDelTecho = { x: 600, y: 80 };
	assert.deepEqual(ladoDeEsquive({ x: 1, y: 0 }, cercaDelTecho, INTERIOR), { x: 0, y: 1 });
	// El rayo va hacia abajo; el jugador está pegado a la pared derecha: hacia la izquierda.
	const cercaDeLaDerecha = { x: 740, y: 450 };
	assert.deepEqual(ladoDeEsquive({ x: 0, y: 1 }, cercaDeLaDerecha, INTERIOR), { x: -1, y: 0 });
});

test('el lado de esquive siempre tiene largo 1 y es perpendicular al rayo, también en diagonal', () => {
	for (const grados of [0, 30, 45, 100, 180, 225, 300]) {
		const radianes = (grados * Math.PI) / 180;
		const direccion = { x: Math.cos(radianes), y: Math.sin(radianes) };
		const lado = ladoDeEsquive(direccion, { x: 500, y: 450 }, INTERIOR);

		assert.ok(Math.abs(Math.hypot(lado.x, lado.y) - 1) < 1e-9, `${grados}°: largo 1`);
		assert.ok(
			Math.abs(lado.x * direccion.x + lado.y * direccion.y) < 1e-9,
			`${grados}°: perpendicular`,
		);
	}
});

test('con el mismo espacio a los dos lados, esquiva por la izquierda del rayo (resultado fijo)', () => {
	assert.deepEqual(ladoDeEsquive({ x: 1, y: 0 }, CENTRO, INTERIOR), { x: 0, y: -1 });
});

test('la distancia a la línea del rayo se mide de lado, no a lo largo', () => {
	const origen = { x: 100, y: 100 };
	assert.equal(distanciaALaLinea({ x: 500, y: 130 }, origen, { x: 1, y: 0 }), 30);
	assert.equal(distanciaALaLinea({ x: 500, y: 70 }, origen, { x: 1, y: 0 }), 30);
	assert.equal(distanciaALaLinea({ x: 100, y: 500 }, origen, { x: 0, y: 1 }), 0);
});

// Que el rayo sea esquivable depende de los números de la configuración: si alguien ensancha el rayo o acorta el
// dash, el dash automático ya no salvaría al jugador (y el juego diría que sí).
test('el dash recorre más que la mitad del rayo más el cuerpo del jugador: sacarlo del camino siempre alcanza', () => {
	const recorrido = (CONFIG.DASH.VELOCIDAD * CONFIG.DASH.DURACION) / 1000;
	const mitadDelRayo = CONFIG.JEFE.RAYO.ANCHO / 2;
	const mitadDelCuerpo = Math.hypot(CONFIG.JUGADOR.CUERPO_ANCHO, CONFIG.JUGADOR.CUERPO_ALTO) / 2;

	assert.ok(recorrido > mitadDelRayo + mitadDelCuerpo, `${recorrido} px de dash no basta`);
});

test('el rayo se abre cuando el jugador ya salió del camino: el dash va primero', () => {
	// En RETRASO_SI_ESQUIVA ms el dash ya llevó al jugador fuera del ancho del rayo.
	// Al acertar se corta la cámara lenta (probado en el juego el 27/11/2026: con la salida suave el dash recorría solo
	// 43 de sus 96 px). El dash dura DURACION ms: pasado ese tiempo ya no avanza más.
	const msDeDash = Math.min(CONFIG.JEFE.RAYO.RETRASO_SI_ESQUIVA, CONFIG.DASH.DURACION);
	const avance = (CONFIG.DASH.VELOCIDAD * msDeDash) / 1000;
	const mitadDelRayo = CONFIG.JEFE.RAYO.ANCHO / 2;
	const mitadDelCuerpo = Math.hypot(CONFIG.JUGADOR.CUERPO_ANCHO, CONFIG.JUGADOR.CUERPO_ALTO) / 2;

	assert.ok(
		avance > mitadDelRayo + mitadDelCuerpo,
		`en ${CONFIG.JEFE.RAYO.RETRASO_SI_ESQUIVA} ms avanza ${avance} px`,
	);
});

test('el ataque básico es mucho más rápido y frecuente que antes (27/11/2026)', () => {
	assert.ok(
		CONFIG.JEFE.PROYECTIL.VELOCIDAD >= 2 * CONFIG.JUGADOR.VELOCIDAD * 0.9,
		'casi el doble que el jugador',
	);
	assert.ok(CONFIG.JEFE.INTERVALO_DE_ATAQUE <= 1000, 'al menos uno por segundo');
});

test('las texturas del rayo existen y todas sus formas caben dentro del dibujo', () => {
	for (const clave of ['rayo-jefe', 'rayo-cabeza']) {
		const { tipo, ancho, alto, formas } = RECURSOS[clave];
		assert.equal(tipo, 'generado', clave);
		assert.ok(formas.length > 0, clave);
		for (const forma of formas) {
			assert.ok(
				forma.x >= 0 &&
					forma.y >= 0 &&
					forma.x + forma.ancho <= ancho &&
					forma.y + forma.alto <= alto,
				`${clave}: una forma se sale del dibujo`,
			);
		}
	}
});

// El dash automático (Dash.forzar).
const DERECHA = { x: 1, y: 0 };
const ARRIBA = { x: 0, y: -1 };
const crearDash = () => new Dash({ duracion: 150, recarga: 1200, cargasMaximas: 1 });

test('un dash forzado empieza ya, en la dirección pedida, y dura lo mismo que uno normal', () => {
	const dash = crearDash();
	dash.forzar(ARRIBA, 1000);

	assert.equal(dash.estaActivo(1000), true);
	assert.equal(dash.estaActivo(1149), true);
	assert.equal(dash.estaActivo(1150), false);
	assert.deepEqual(dash.direccion, ARRIBA);
});

test('un dash forzado sale aunque no queden cargas, y no las gasta ni toca la recarga', () => {
	const dash = crearDash();
	assert.equal(dash.intentar(DERECHA, 1000), true); // la única carga se gasta
	assert.equal(dash.cargasDisponibles(1300), 0);

	dash.forzar(ARRIBA, 1300);
	assert.equal(dash.estaActivo(1300), true);
	assert.equal(dash.cargasDisponibles(1300), 0, 'no regala ni quita cargas');
	assert.equal(
		dash.progresoDeLaRecarga(1600),
		0.5,
		'la recarga sigue contando desde el primer uso',
	);
});

test('un dash forzado con las cargas llenas no gasta ninguna', () => {
	const dash = crearDash();
	dash.forzar(ARRIBA, 1000);

	assert.equal(dash.cargasDisponibles(1000), 1);
	assert.equal(dash.progresoDeLaRecarga(1000), 1);
});
