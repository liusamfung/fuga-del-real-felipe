import Phaser from 'phaser';
import { MODOS_DE_DELETREO } from '../config.js';
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
		this.teclasDeDeletreo = [
			{ tecla: teclado.addKey('E'), modo: MODOS_DE_DELETREO.VISIBLE },
			{ tecla: teclado.addKey('T'), modo: MODOS_DE_DELETREO.HUECOS },
			{ tecla: teclado.addKey('Y'), modo: MODOS_DE_DELETREO.MEMORIA },
		];
		this.teclaDeDeletreoInvertido = teclado.addKey('R');
		this.teclaMayuscula = teclado.addKey('SHIFT');
		this.teclaDeVoz = teclado.addKey('V');
		this.movimientoBloqueado = false;
	}

	/**
	 * Bloquea o desbloquea el movimiento y el dash. Se bloquean mientras se deletrea, porque las
	 * letras W, A, S y D son las mismas teclas con las que se camina.
	 */
	bloquearMovimiento(bloqueado) {
		this.movimientoBloqueado = bloqueado;
	}

	/**
	 * Provisional (hasta que el deletreo sea un poder, paso 9): E pide una palabra al azar con la
	 * palabra siempre visible, T con huecos (Ahorcado) e Y de memoria. Con Mayúsculas pulsada se pide
	 * al revés. R pide una palabra fácil al revés, siempre visible.
	 * Devuelve `{ modo, invertida }` en el fotograma en que se pulsa, o null.
	 * Se debe consultar en cada fotograma, para que una pulsación vieja no quede esperando.
	 */
	deletreoPedido() {
		// Se consultan todas las teclas, aunque una ya haya dado respuesta: JustDown "gasta" la pulsación.
		const pulsadas = this.teclasDeDeletreo.filter(({ tecla }) =>
			Phaser.Input.Keyboard.JustDown(tecla),
		);
		const invertido = Phaser.Input.Keyboard.JustDown(this.teclaDeDeletreoInvertido);

		if (invertido) {
			return { modo: MODOS_DE_DELETREO.VISIBLE, invertida: true };
		}
		if (pulsadas.length > 0) {
			return { modo: pulsadas[0].modo, invertida: this.teclaMayuscula.isDown };
		}
		return null;
	}

	/**
	 * Provisional: V activa o desactiva deletrear con la voz. Devuelve verdadero en el fotograma en
	 * que se pulsa. Se debe consultar en cada fotograma (JustDown "gasta" la pulsación).
	 */
	vozAlternada() {
		return Phaser.Input.Keyboard.JustDown(this.teclaDeVoz);
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
	 * Verdadero en el fotograma en que se pulsa la barra espaciadora. Mantenerla pulsada no repite:
	 * cada dash necesita una pulsación nueva.
	 */
	dashPulsado() {
		const pulsada = Phaser.Input.Keyboard.JustDown(this.flechas.space); // se consume siempre
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
