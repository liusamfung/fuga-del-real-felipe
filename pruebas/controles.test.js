import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Los controles (27/11/2026): el dash va en SHIFT y el ataque especial (la granada) en ESPACIO. `Entrada` necesita Phaser,
// así que aquí se revisa su código: si alguien vuelve a mover una tecla, esta prueba avisa y obliga a tocar la
// documentación (README.md y docs/mecanicas.md).
const entrada = readFileSync(new URL('../src/sistemas/Entrada.js', import.meta.url), 'utf8');

test('el dash se hace con SHIFT', () => {
	assert.match(entrada, /teclaDeDash = teclado\.addKey\('SHIFT'\)/);
	assert.match(entrada, /JustDown\(this\.teclaDeDash\)/);
});

test('el ataque especial (la granada) se pide con ESPACIO, no con G', () => {
	assert.match(entrada, /teclaDeGranada = teclado\.addKey\('SPACE'\)/);
	assert.doesNotMatch(entrada, /addKey\('G'\)/);
});

test('el dash ya no usa la barra espaciadora y SHIFT ya no es el modificador de «al revés»', () => {
	assert.doesNotMatch(entrada, /flechas\.space/);
	assert.doesNotMatch(entrada, /teclaMayuscula/);
	assert.match(entrada, /teclaDeInvertir = teclado\.addKey\('Q'\)/);
});

test('cada tecla del juego se usa para una sola cosa', () => {
	const teclas = [...entrada.matchAll(/addKey\('([A-Z]+)'\)/g)].map(
		(coincidencia) => coincidencia[1],
	);
	const repetidas = teclas.filter((tecla, i) => teclas.indexOf(tecla) !== i);
	assert.deepEqual(repetidas, [], `teclas asignadas dos veces: ${repetidas.join(', ')}`);
});
