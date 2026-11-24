import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// Una bala del jugador. No se crea una por disparo: el sistema `Disparo` reserva unas pocas
// y las recicla. Un grupo de Phaser crea cada bala y le da su cuerpo físico, por eso aquí
// no se llama a `physics.add.existing`.
export class Bala extends Phaser.Physics.Arcade.Image {
	constructor(escena, x, y) {
		super(escena, x, y, 'bala');
		this.dano = 0;
	}

	/**
	 * Activa la bala en (x, y) y la lanza en la dirección dada (un vector de largo 1).
	 * `dano` es lo que le quita a lo que golpee (el ataque del jugador).
	 */
	disparar(x, y, direccion, dano) {
		const { VELOCIDAD_BALA, PROFUNDIDAD_BALAS } = CONFIG.DISPARO;

		this.enableBody(true, x, y, true, true);
		this.setDepth(PROFUNDIDAD_BALAS);
		this.dano = dano;
		this.setVelocity(direccion.x * VELOCIDAD_BALA, direccion.y * VELOCIDAD_BALA);
	}

	/** Apaga la bala para que se pueda reutilizar en el próximo disparo. */
	desactivar() {
		this.disableBody(true, true);
	}
}
