import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';
import { ANIMACIONES } from '../src/datos/animaciones.js';
import { RECURSOS } from '../src/datos/recursos.js';

// Estas pruebas leen los PNG reales de public/ y comprueban que el catálogo de recursos
// (src/datos/recursos.js) y las animaciones (src/datos/animaciones.js) dicen la verdad sobre ellos: si
// alguien cambia un dibujo por otro de otro tamaño, o se equivoca de número de cuadro, el juego mostraría
// el cuadro cortado o uno vacío, sin avisar. Aquí falla antes.

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const DIBUJOS = Object.entries(RECURSOS).filter(([, recurso]) => recurso.tipo !== 'generado');
const HOJAS = DIBUJOS.filter(([, recurso]) => recurso.tipo === 'hoja');

function leerPng(ruta) {
	const bytes = readFileSync(new URL(`../public/${ruta}`, import.meta.url));
	assert.ok(bytes.subarray(0, 8).equals(FIRMA_PNG), `${ruta} no es un PNG`);
	// En un PNG el ancho y el alto están en la cabecera (bytes 16 a 23).
	return { ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) };
}

const cuadrosDeLaHoja = (clave) => {
	const { ruta, ancho, alto } = RECURSOS[clave];
	const imagen = leerPng(ruta);
	return (imagen.ancho / ancho) * (imagen.alto / alto);
};

test('cada recurso que es un archivo existe en public/ y es un PNG', () => {
	assert.ok(DIBUJOS.length > 0);
	for (const [clave, { ruta }] of DIBUJOS) {
		assert.doesNotThrow(() => leerPng(ruta), `${clave}: no se pudo leer ${ruta}`);
	}
});

test('los archivos se nombran en minúsculas, con guiones y sin espacios (docs/guia-de-recursos.md)', () => {
	for (const [clave, { ruta }] of DIBUJOS) {
		const nombre = ruta.split('/').at(-1);
		assert.match(nombre, /^[a-z0-9-]+\.png$/, `${clave}: «${nombre}» no sigue la guía de nombres`);
	}
});

test('cada hoja de sprites mide un número exacto de cuadros (sin cuadros cortados)', () => {
	for (const [clave, { ruta, ancho, alto }] of HOJAS) {
		const imagen = leerPng(ruta);
		assert.equal(
			imagen.ancho % ancho,
			0,
			`${clave}: ${imagen.ancho} px de ancho no es múltiplo de ${ancho}`,
		);
		assert.equal(
			imagen.alto % alto,
			0,
			`${clave}: ${imagen.alto} px de alto no es múltiplo de ${alto}`,
		);
		assert.ok(cuadrosDeLaHoja(clave) >= 1, clave);
	}
});

test('cada animación usa una hoja que existe y solo cuadros que esa hoja tiene', () => {
	for (const { clave, textura, cuadros, fps } of ANIMACIONES) {
		assert.ok(
			HOJAS.some(([nombre]) => nombre === textura),
			`${clave}: la hoja «${textura}» no existe`,
		);
		assert.ok(fps > 0, `${clave}: fps`);
		const total = cuadrosDeLaHoja(textura);
		for (const cuadro of cuadros) {
			assert.ok(
				Number.isInteger(cuadro) && cuadro >= 0 && cuadro < total,
				`${clave}: el cuadro ${cuadro} no existe (la hoja «${textura}» tiene ${total})`,
			);
		}
	}
});

test('no se repite el nombre de ninguna animación', () => {
	const claves = ANIMACIONES.map(({ clave }) => clave);
	assert.equal(new Set(claves).size, claves.length);
});

test('el segundo jefe: 3 cuadros de 32×32 en una fila, y su animación de flotar usa los tres', () => {
	assert.equal(RECURSOS['jefe-2'].ancho, 32);
	assert.equal(RECURSOS['jefe-2'].alto, 32);
	assert.deepEqual(leerPng(RECURSOS['jefe-2'].ruta), { ancho: 96, alto: 32 });
	assert.equal(cuadrosDeLaHoja('jefe-2'), 3);

	const flotar = ANIMACIONES.find(({ clave }) => clave === 'jefe-2-flotar');
	assert.ok(flotar, 'falta la animación jefe-2-flotar');
	assert.deepEqual([...new Set(flotar.cuadros)].sort(), [0, 1, 2], 'usa los tres cuadros');
	assert.equal(flotar.repetir, true);
});

test('el jefe del juego (CONFIG.JEFE) apunta a una hoja que existe y tiene su animación de flotar', () => {
	const { CLAVE, ESCALA } = CONFIG.JEFE;
	assert.ok(
		HOJAS.some(([nombre]) => nombre === CLAVE),
		`la hoja «${CLAVE}» no existe`,
	);
	assert.ok(
		ANIMACIONES.some(({ clave }) => clave === `${CLAVE}-flotar`),
		`falta la animación ${CLAVE}-flotar`,
	);
	assert.ok(Number.isInteger(ESCALA) && ESCALA >= 1, 'con pixel art la escala debe ser un entero');
});

test('el jefe del nivel 1 tiene su hoja de 3 cuadros de 32 × 32 (provisional) y su animación de flotar', () => {
	assert.equal(RECURSOS['jefe-1'].ancho, 32);
	assert.equal(RECURSOS['jefe-1'].alto, 32);
	assert.deepEqual(leerPng(RECURSOS['jefe-1'].ruta), { ancho: 96, alto: 32 });
	assert.equal(cuadrosDeLaHoja('jefe-1'), 3);

	const flotar = ANIMACIONES.find(({ clave }) => clave === 'jefe-1-flotar');
	assert.ok(flotar, 'falta la animación jefe-1-flotar');
	assert.deepEqual([...new Set(flotar.cuadros)].sort(), [0, 1, 2], 'usa los tres cuadros');
	assert.equal(flotar.repetir, true);
});
