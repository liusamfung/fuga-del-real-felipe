import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// El personaje que controla el jugador. Por ahora solo se mueve.
export class Jugador extends Phaser.Physics.Arcade.Sprite {
	constructor(escena, x, y) {
		super(escena, x, y, 'jugador');
		escena.add.existing(this);
		escena.physics.add.existing(this);

		const { ANCHO, ALTO, CUERPO_ANCHO, CUERPO_ALTO, VELOCIDAD } = CONFIG.JUGADOR;
		this.velocidad = VELOCIDAD;

		// El cuerpo de choque son solo los pies: centrado a lo ancho y pegado al borde de abajo.
		this.body.setSize(CUERPO_ANCHO, CUERPO_ALTO);
		this.body.setOffset((ANCHO - CUERPO_ANCHO) / 2, ALTO - CUERPO_ALTO);
	}

	/** Mueve al jugador en la dirección dada (un vector de largo 1, o (0, 0) para quedarse quieto). */
	mover(direccion) {
		this.setVelocity(direccion.x * this.velocidad, direccion.y * this.velocidad);
		// Dibujar más adelante a quien está más abajo en la pantalla (vista top-down).
		this.setDepth(this.body.bottom);
	}
}
