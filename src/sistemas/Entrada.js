import { normalizar } from '../utilidades/vectores.js';

// Traduce las teclas y el ratón en "acciones" del juego.
// El resto del código pregunta por acciones ("hacia dónde se mueve"), no por teclas concretas.
// Así, cambiar los controles o agregar otro modo de entrada no obliga a tocar al jugador.
export class Entrada {
	constructor(escena) {
		const teclado = escena.input.keyboard;
		this.flechas = teclado.createCursorKeys();
		this.wasd = teclado.addKeys({ arriba: 'W', abajo: 'S', izquierda: 'A', derecha: 'D' });
	}

	/** Dirección de movimiento con largo 1 (o (0, 0) si no hay teclas pulsadas). */
	direccionDeMovimiento() {
		const izquierda = this.flechas.left.isDown || this.wasd.izquierda.isDown;
		const derecha = this.flechas.right.isDown || this.wasd.derecha.isDown;
		const arriba = this.flechas.up.isDown || this.wasd.arriba.isDown;
		const abajo = this.flechas.down.isDown || this.wasd.abajo.isDown;

		return normalizar(Number(derecha) - Number(izquierda), Number(abajo) - Number(arriba));
	}
}
