import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CONFIG, ESCENAS } from '../src/config.js';
import {
	CREDITOS,
	SUBTITULO_DEL_JUEGO,
	TEXTO_PARA_COMENZAR,
	TITULO_DEL_JUEGO,
} from '../src/datos/creditos.js';
import { FOTOGRAMAS_TILESET } from '../src/datos/recursos.js';

// La portada (27/11/2026): el nombre del juego, quiénes lo hicieron y «Pulsa ENTER para comenzar». `EscenaPortada` necesita
// Phaser, así que aquí se prueban sus datos y se revisa su código y su conexión con el resto del juego.
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const escena = leer('../src/escenas/EscenaPortada.js');
const arranque = leer('../src/escenas/EscenaArranque.js');
const principal = leer('../src/main.js');

const nombresDelEquipo = CREDITOS.flatMap(({ nombres }) => nombres);

test('la portada dice el nombre del juego y desde cuándo y dónde ocurre', () => {
	assert.equal(TITULO_DEL_JUEGO.join(' '), 'FUGA DEL REAL FELIPE');
	assert.match(SUBTITULO_DEL_JUEGO, /Callao/);
});

test('la portada nombra a los cuatro integrantes del equipo, cada uno con su rol', () => {
	for (const nombre of ['Liu Fung', 'Sebastián', 'Carlo Flores', 'Jorge Vega']) {
		assert.ok(nombresDelEquipo.includes(nombre), `falta ${nombre}`);
	}
	assert.equal(nombresDelEquipo.length, 4, 'nadie sale dos veces ni sobra nadie');
	assert.equal(new Set(nombresDelEquipo).size, nombresDelEquipo.length);
	for (const { rol, nombres } of CREDITOS) {
		assert.ok(rol.trim().length > 0, 'cada grupo tiene su rol');
		assert.ok(nombres.length > 0 && nombres.every((n) => n.trim().length > 0));
	}
});

test('quien programó es uno solo y el arte y el diseño visual son de los otros tres', () => {
	const programacion = CREDITOS.find(({ rol }) => /Programaci/.test(rol));
	const arte = CREDITOS.find(({ rol }) => /Sprites/.test(rol));
	assert.deepEqual(programacion.nombres, ['Liu Fung']);
	assert.deepEqual([...arte.nombres].sort(), ['Carlo Flores', 'Jorge Vega', 'Sebastián']);
});

test('la portada pide pulsar ENTER para comenzar', () => {
	assert.match(TEXTO_PARA_COMENZAR, /ENTER/);
	assert.match(TEXTO_PARA_COMENZAR, /comenzar/i);
});

test('los textos caben en la portada (800 px de ancho con marco de 24 px, letra monoespaciada)', () => {
	const ancho = CONFIG.ANCHO - 2 * 24 - 40; // lo que queda dentro del marco, con un respiro
	const anchoDeUnaLetra = (tamano) => tamano * 0.62; // una letra monoespaciada mide ~0,6 de su tamaño; se redondea hacia arriba
	const lineas = [
		...TITULO_DEL_JUEGO.map((texto) => ({ texto, tamano: 66 })),
		{ texto: SUBTITULO_DEL_JUEGO, tamano: 20 },
		{ texto: TEXTO_PARA_COMENZAR, tamano: 28 },
		...CREDITOS.map(({ nombres }) => ({ texto: nombres.join('   ·   '), tamano: 24 })),
	];
	for (const { texto, tamano } of lineas) {
		assert.ok(texto.length * anchoDeUnaLetra(tamano) <= ancho, `«${texto}» no cabe en la portada`);
	}
});

test('al abrir el juego se ve la portada primero, y de ahí se pasa al nivel 1 con ENTER', () => {
	// El arranque ya no empieza el juego: abre la portada.
	assert.match(arranque, /this\.scene\.start\(ESCENAS\.PORTADA\)/);
	assert.doesNotMatch(arranque, /this\.scene\.start\(ESCENAS\.JUEGO\)/);
	// La portada empieza el juego con ENTER (también el del teclado numérico).
	assert.match(escena, /keydown-ENTER/);
	assert.match(escena, /keydown-NUMPAD_ENTER/);
	assert.match(escena, /this\.scene\.start\(ESCENAS\.JUEGO\)/);
	// Está registrada en el juego y tiene su nombre de escena.
	assert.equal(ESCENAS.PORTADA, 'EscenaPortada');
	assert.match(principal, /EscenaPortada,/);
});

test('pulsar ENTER dos veces seguidas no empieza el juego dos veces', () => {
	assert.match(escena, /if \(this\.comenzando\)/);
	assert.match(escena, /this\.comenzando = true/);
});

test('la portada solo usa recursos que existen (el suelo de la prisión y los tres personajes del adorno)', () => {
	assert.equal(typeof FOTOGRAMAS_TILESET.sueloRayas, 'number');
	for (const clave of ['jefe-1', 'jefe-2', 'jugador']) {
		assert.match(escena, new RegExp(`'${clave}'`), `la portada debería mostrar ${clave}`);
	}
	for (const animacion of ['jefe-1-flotar', 'jefe-2-flotar']) {
		assert.match(escena, new RegExp(animacion));
	}
});

test('la portada tiene su configuración: el fundido, el parpadeo y los colores', () => {
	const { FUNDIDO, PARPADEO, COLOR_DEL_TITULO, COLOR_DEL_TEXTO, COLOR_APAGADO } = CONFIG.PORTADA;
	assert.ok(FUNDIDO > 0 && FUNDIDO < 1000, 'el fundido no debe hacer esperar');
	assert.ok(PARPADEO > 0);
	assert.ok(Number.isInteger(COLOR_DEL_TITULO));
	assert.match(COLOR_DEL_TEXTO, /^#[0-9a-f]{6}$/i);
	assert.match(COLOR_APAGADO, /^#[0-9a-f]{6}$/i);
});
