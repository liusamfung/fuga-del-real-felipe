import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONFIG } from '../src/config.js';

// El cartel con el resultado de un reto de opciones (¡Bien!, ¡Te equivocaste!…). El 27/11/2026 el usuario pidió que
// dure 0,5 s o menos y que el juego siga en cámara lenta hasta que desaparezca; la parte de la cámara lenta está en
// `EscenaOpciones` (avisa al juego recién al cerrarse) y se comprobó jugando. Aquí se protege el tiempo.
const { TIEMPO_DEL_RESULTADO } = CONFIG.INGLES.OPCIONES;

test('el resultado de un reto de opciones se ve 0,5 s o menos', () => {
	assert.ok(TIEMPO_DEL_RESULTADO <= 500, `${TIEMPO_DEL_RESULTADO} ms es demasiado`);
});

test('pero se ve lo bastante para leerlo: al menos 0,25 s', () => {
	assert.ok(TIEMPO_DEL_RESULTADO >= 250, `${TIEMPO_DEL_RESULTADO} ms no se alcanza a leer`);
});
