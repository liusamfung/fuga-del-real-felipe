import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// Un cofre con una mejora dentro. Es un objeto sólido: se abre cuando el jugador lo toca.
// La escena decide qué pasa al abrirlo (aplicar la mejora, mostrar el texto…).
// `mejora` es la clave de la recompensa, por ejemplo 'vida', 'ataque' o 'velocidad'.
export class Cofre extends Phaser.Physics.Arcade.Sprite {
	constructor(escena, x, y, mejora) {
		super(escena, x, y, 'cofre-cerrado');
		escena.add.existing(this);
		escena.physics.add.existing(this, true); // cuerpo estático: no se mueve

		this.mejora = mejora;
		this.abierto = false;
		this.setDepth(y + CONFIG.COFRE.ALTO / 2);

		// Aparece creciendo, para que se note que acaba de salir. El cuerpo de choque ya tiene su
		// tamaño completo porque se creó antes de cambiar la escala.
		this.setScale(0);
		escena.tweens.add({ targets: this, scale: 1, duration: 250, ease: 'Back.Out' });
	}

	/** Abre el cofre y devuelve la clave de la mejora. Si ya estaba abierto, devuelve null. */
	abrir() {
		if (this.abierto) {
			return null;
		}
		this.abierto = true;
		this.setTexture('cofre-abierto');
		return this.mejora;
	}
}
