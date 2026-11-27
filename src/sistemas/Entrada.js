import Phaser from 'phaser';
import { normalizar } from '../utilidades/vectores.js';

// Traduce las teclas y el ratón en "acciones" del juego.
// El resto del código pregunta por acciones ("hacia dónde se mueve"), no por teclas concretas.
// Así, cambiar los controles o agregar otro modo de entrada no obliga a tocar al jugador.
export class Entrada {
	constructor(escena) {
		const teclado = escena.input.keyboard;
		this.flechas = teclado.createCursorKeys();
		this.wasd = teclado.addKeys({ arriba: 'W', abajo: 'S', izquierda: 'A', derecha: 'D' });
		this.puntero = escena.input.activePointer;
		this.teclaDeDash = teclado.addKey('SHIFT');
		this.teclaDeGranada = teclado.addKey('SPACE'); // el ataque especial
		this.teclaDelSilencio = teclado.addKey('M');
		this.movimientoBloqueado = false;
	}

	/**
	 * Bloquea o desbloquea el movimiento y el dash. Se bloquean mientras se responde un reto de inglés (sobre todo
	 * el dictado, que se escribe con el teclado), porque las letras W, A, S y D son las mismas teclas con las que se camina.
	 */
	bloquearMovimiento(bloqueado) {
		this.movimientoBloqueado = bloqueado;
	}

	/**
	 * ESPACIO pide la granada (el ataque especial): para lanzarla hay que superar un reto de inglés. Devuelve
	 * verdadero en el fotograma en que se pulsa. Se debe consultar en cada fotograma (JustDown
	 * "gasta" la pulsación).
	 */
	granadaPedida() {
		return Phaser.Input.Keyboard.JustDown(this.teclaDeGranada);
	}

	/**
	 * M silencia o devuelve el sonido. Devuelve verdadero en el fotograma en que se pulsa. Se debe consultar en cada
	 * fotograma (JustDown "gasta" la pulsación).
	 */
	silencioPedido() {
		return Phaser.Input.Keyboard.JustDown(this.teclaDelSilencio);
	}

	/**
	 * Punto de la sala al que apunta el ratón, en píxeles. Devuelve null mientras el ratón no se ha
	 * movido ni se ha pulsado dentro del juego: hasta entonces Phaser cree que está en (0, 0).
	 */
	puntoDeApuntado() {
		if (this.puntero.moveTime === 0 && this.puntero.downTime === 0) {
			return null;
		}
		return { x: this.puntero.worldX, y: this.puntero.worldY };
	}

	/** Verdadero mientras el botón izquierdo del ratón está pulsado (un clic o mantenerlo). */
	estaDisparando() {
		return this.puntero.leftButtonDown();
	}

	/**
	 * Verdadero en el fotograma en que se pulsa Mayúsculas (Shift). Mantenerla pulsada no repite:
	 * cada dash necesita una pulsación nueva.
	 */
	dashPulsado() {
		const pulsada = Phaser.Input.Keyboard.JustDown(this.teclaDeDash); // se consume siempre
		return pulsada && !this.movimientoBloqueado;
	}

	/** Dirección de movimiento con largo 1 (o (0, 0) si no hay teclas pulsadas). */
	direccionDeMovimiento() {
		if (this.movimientoBloqueado) {
			return { x: 0, y: 0 };
		}

		const izquierda = this.flechas.left.isDown || this.wasd.izquierda.isDown;
		const derecha = this.flechas.right.isDown || this.wasd.derecha.isDown;
		const arriba = this.flechas.up.isDown || this.wasd.arriba.isDown;
		const abajo = this.flechas.down.isDown || this.wasd.abajo.isDown;

		return normalizar(Number(derecha) - Number(izquierda), Number(abajo) - Number(arriba));
	}
}
