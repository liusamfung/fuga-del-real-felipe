import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Los controles. `Entrada` necesita Phaser, así que aquí se revisa su código: si alguien agrega o mueve una tecla, estas
// pruebas avisan y obligan a tocar la documentación (README.md y docs/mecanicas.md).
//
// Controles del juego (27/11/2026):
//   - moverse: flechas o W A S D; apuntar y disparar: el ratón
//   - dash: SHIFT; ataque especial (la granada): ESPACIO; silenciar: M
// Ya no hay atajos de prueba (ir al jefe, saltar de nivel, pedir retos sueltos…): el juego se publica sin ellos.
const entrada = readFileSync(new URL('../src/sistemas/Entrada.js', import.meta.url), 'utf8');
const juego = readFileSync(new URL('../src/escenas/EscenaJuego.js', import.meta.url), 'utf8');
const principal = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

const teclasDeLetra = [...entrada.matchAll(/addKey\('([A-Z]+)'\)/g)].map((m) => m[1]);
const teclasDeGrupo = [...entrada.matchAll(/(?:arriba|abajo|izquierda|derecha): '([A-Z])'/g)].map(
	(m) => m[1],
);

test('el dash se hace con SHIFT', () => {
	assert.match(entrada, /teclaDeDash = teclado\.addKey\('SHIFT'\)/);
	assert.match(entrada, /JustDown\(this\.teclaDeDash\)/);
});

test('el ataque especial (la granada) se pide con ESPACIO, no con G', () => {
	assert.match(entrada, /teclaDeGranada = teclado\.addKey\('SPACE'\)/);
	assert.doesNotMatch(entrada, /addKey\('G'\)/);
});

test('el dash ya no usa la barra espaciadora', () => {
	assert.doesNotMatch(entrada, /flechas\.space/);
});

test('solo hay tres teclas sueltas (Shift, Espacio y M) además de las de moverse', () => {
	assert.deepEqual([...teclasDeLetra].sort(), ['M', 'SHIFT', 'SPACE']);
	assert.deepEqual([...teclasDeGrupo].sort(), ['A', 'D', 'S', 'W']);
});

test('no quedan atajos de prueba: ni ir al jefe (J), ni saltar de nivel (K), ni retos sueltos (E, T, Y, I, R, O, P, V, Q)', () => {
	for (const letra of ['J', 'K', 'E', 'T', 'Y', 'I', 'R', 'O', 'P', 'V', 'Q', 'G']) {
		assert.ok(!teclasDeLetra.includes(letra), `la tecla ${letra} no debería estar registrada`);
	}
	for (const metodo of [
		'irAlJefePedido',
		'irAlNivel2Pedido',
		'deletreoPedido',
		'retoDeOpcionesPedido',
		'vozAlternada',
	]) {
		assert.doesNotMatch(entrada, new RegExp(metodo), `Entrada todavía tiene ${metodo}`);
		assert.doesNotMatch(juego, new RegExp(metodo), `EscenaJuego todavía usa ${metodo}`);
	}
	assert.doesNotMatch(juego, /irALaSalaDelJefe|scene\.restart\(\{ nivel: 2 \}\)/);
});

test('cada tecla del juego se usa para una sola cosa', () => {
	const todas = [...teclasDeLetra, ...teclasDeGrupo];
	const repetidas = todas.filter((tecla, i) => todas.indexOf(tecla) !== i);
	assert.deepEqual(repetidas, [], `teclas asignadas dos veces: ${repetidas.join(', ')}`);
});

test('las herramientas de desarrollo (?debug y las pruebas de voz) solo funcionan con `npm run dev`', () => {
	// `import.meta.env.DEV` es falso en la compilación: sin esto, agregar `?debug` a la dirección del juego publicado
	// mostraría los cuerpos de choque y regalaría `window.juego` en la consola.
	assert.match(principal, /const esDesarrollo = import\.meta\.env\.DEV;/);
	assert.match(principal, /modoDebug = esDesarrollo && /);
	assert.match(
		principal,
		/if \(esDesarrollo\) \{[\s\S]*import\('\.\/escenas\/EscenaPruebaVoz\.js'\)/,
	);
	assert.doesNotMatch(
		principal,
		/^import \{ EscenaPrueba/m,
		'las pruebas no deben importarse siempre',
	);

	const arranque = readFileSync(
		new URL('../src/escenas/EscenaArranque.js', import.meta.url),
		'utf8',
	);
	assert.match(arranque, /if \(import\.meta\.env\.DEV\) \{/);
	const opciones = readFileSync(
		new URL('../src/escenas/EscenaOpciones.js', import.meta.url),
		'utf8',
	);
	assert.match(opciones, /import\.meta\.env\.DEV && /);
});
