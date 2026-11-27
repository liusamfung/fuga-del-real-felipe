import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RampaDeTiempo } from '../src/sistemas/RampaDeTiempo.js';

const crear = () => new RampaDeTiempo({ factor: 0.2, entrada: 100, salida: 200 });
const cerca = (real, esperado, mensaje) =>
	assert.ok(Math.abs(real - esperado) < 1e-9, `${mensaje}: ${real} no es ${esperado}`);

test('al principio va a velocidad normal y no está en cámara lenta', () => {
	const rampa = crear();
	assert.equal(rampa.escala(0), 1);
	assert.equal(rampa.escala(99999), 1);
	assert.equal(rampa.estaEnCamaraLenta(0), false);
});

test('al pedir cámara lenta baja de forma suave hasta el factor, en el tiempo de entrada', () => {
	const rampa = crear();
	rampa.fijar(true, 1000);
	cerca(rampa.escala(1000), 1, 'al empezar sigue en 1');
	cerca(rampa.escala(1050), 0.6, 'a la mitad: 1 y 0,2 están a 0,6');
	cerca(rampa.escala(1100), 0.2, 'al terminar la entrada: el factor');
	cerca(rampa.escala(5000), 0.2, 'y se queda ahí');
	assert.equal(rampa.estaEnCamaraLenta(1001), true);
});

test('al pedir velocidad normal vuelve suave, en el tiempo de salida (más largo que la entrada)', () => {
	const rampa = crear();
	rampa.fijar(true, 0);
	rampa.fijar(false, 1000); // ya estaba en plena cámara lenta
	cerca(rampa.escala(1000), 0.2, 'al empezar la salida sigue lento');
	cerca(rampa.escala(1100), 0.6, 'a la mitad de los 200 ms');
	cerca(rampa.escala(1200), 1, 'al terminar: normal');
	assert.equal(rampa.estaEnCamaraLenta(1199), true);
	assert.equal(rampa.estaEnCamaraLenta(1200), false);
});

test('repetir el mismo pedido en cada fotograma no reinicia la rampa', () => {
	const rampa = crear();
	rampa.fijar(true, 1000);
	rampa.fijar(true, 1040);
	rampa.fijar(true, 1070);
	cerca(rampa.escala(1050), 0.6, 'sigue la rampa original');
	rampa.fijar(false, 5000);
	rampa.fijar(false, 5100);
	cerca(rampa.escala(5100), 0.6, 'la salida tampoco se reinicia');
});

test('si cambia de idea a mitad de la entrada, sigue desde donde iba y tarda proporcionalmente menos', () => {
	const rampa = crear();
	rampa.fijar(true, 0);
	cerca(rampa.escala(50), 0.6, 'a mitad de la entrada');
	rampa.fijar(false, 50); // se arrepiente: vuelve a 1 desde 0,6
	cerca(rampa.escala(50), 0.6, 'sin saltos');
	// Le falta recorrer 0,4 de 0,8 = la mitad: 100 ms de los 200 de salida.
	cerca(rampa.escala(100), 0.8, 'a mitad de la vuelta');
	cerca(rampa.escala(150), 1, 'vuelve a 1 en la mitad del tiempo de salida');
});

test('la escala nunca sale del rango entre el factor y 1, ni con el reloj hacia atrás', () => {
	const rampa = crear();
	rampa.fijar(true, 1000);
	for (const ahora of [-5000, 0, 999, 1000, 1050, 1100, 1e9]) {
		const escala = rampa.escala(ahora);
		assert.ok(escala >= 0.2 - 1e-9 && escala <= 1 + 1e-9, `${ahora}: ${escala}`);
	}
	cerca(rampa.escala(500), 1, 'con el reloj atrás, todavía no empezó');
});

test('con entrada y salida en 0 el cambio es inmediato', () => {
	const rampa = new RampaDeTiempo({ factor: 0.5, entrada: 0, salida: 0 });
	rampa.fijar(true, 100);
	assert.equal(rampa.escala(100), 0.5);
	rampa.fijar(false, 200);
	assert.equal(rampa.escala(200), 1);
});

test('otro factor: la rampa va de 1 al factor que se pida', () => {
	const rampa = new RampaDeTiempo({ factor: 0.5, entrada: 100, salida: 100 });
	rampa.fijar(true, 0);
	cerca(rampa.escala(50), 0.75, 'a la mitad entre 1 y 0,5');
	cerca(rampa.escala(100), 0.5, 'el factor');
});

test('cortar vuelve a la velocidad normal de golpe, sin rampa, y se puede volver a pedir cámara lenta', () => {
	const rampa = crear();
	rampa.fijar(true, 0);
	cerca(rampa.escala(500), 0.2, 'en plena cámara lenta');

	rampa.cortar();
	assert.equal(rampa.escala(500), 1, 'al instante, sin pasar por los valores de en medio');
	assert.equal(rampa.estaEnCamaraLenta(500), false);

	rampa.fijar(false, 510); // pedir lo que ya está no hace nada
	assert.equal(rampa.escala(510), 1);

	rampa.fijar(true, 1000); // y la próxima cámara lenta empieza desde 1 como siempre
	cerca(rampa.escala(1050), 0.6, 'la nueva entrada va de 1 al factor');
});

test('cortar a mitad de la rampa de entrada también deja el mundo a velocidad normal', () => {
	const rampa = crear();
	rampa.fijar(true, 0);
	rampa.cortar();
	assert.equal(rampa.escala(50), 1);
});
