import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// Un proyectil del ataque básico del jefe. Igual que las balas del jugador, no se crea uno por ataque: se
// reservan unos pocos y se reciclan (ver `Jefe.lanzarUnProyectil`). Un grupo de Phaser crea cada proyectil y le
// da su cuerpo físico.
export class ProyectilDelJefe extends Phaser.Physics.Arcade.Image {
	constructor(escena, x, y) {
		super(escena, x, y, 'proyectil-jefe');
		this.dano = 0;
	}

	/** Activa el proyectil en (x, y) y lo lanza en la dirección dada (un vector de largo 1). */
	lanzar(x, y, direccion) {
		const { VELOCIDAD, DANO } = CONFIG.JEFE.PROYECTIL;

		this.enableBody(true, x, y, true, true);
		this.setDepth(CONFIG.DISPARO.PROFUNDIDAD_BALAS);
		this.dano = DANO;
		this.setVelocity(direccion.x * VELOCIDAD, direccion.y * VELOCIDAD);
	}

	/** Apaga el proyectil para que se pueda reutilizar. */
	desactivar() {
		this.disableBody(true, true);
	}
}
