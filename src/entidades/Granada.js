import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { tiempoDeVuelo } from '../utilidades/explosion.js';

// La granada del jugador: vuela en línea recta hasta el punto al que apuntaba y avisa al llegar.
// Quien la lanza se encarga de la explosión (el daño y el dibujo): así la granada solo sabe volar.
export class Granada extends Phaser.GameObjects.Image {
	constructor(escena, x, y) {
		super(escena, x, y, 'granada');
		escena.add.existing(this);
		this.setDepth(CONFIG.DISPARO.PROFUNDIDAD_BALAS);
	}

	/**
	 * Lanza la granada hacia `destino` (un objeto con `x` e `y`). Al llegar se destruye y llama a
	 * `alLlegar(destino)`. Gira mientras vuela.
	 */
	lanzar(destino, alLlegar) {
		const { VELOCIDAD, VUELO_MINIMO } = CONFIG.PODERES.GRANADA;
		const duracion = tiempoDeVuelo(this, destino, VELOCIDAD, VUELO_MINIMO);

		this.scene.tweens.add({
			targets: this,
			x: destino.x,
			y: destino.y,
			angle: 360,
			duration: duracion,
			onComplete: () => {
				this.destroy();
				alLlegar(destino);
			},
		});
	}
}
