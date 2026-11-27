import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// Una bala disparada por un enemigo (los guardias del nivel 2). Igual que las balas del jugador y los proyectiles
// del jefe, no se crea una por disparo: se reservan unas cuantas y se reciclan (ver `BalasEnemigas`).
export class BalaEnemiga extends Phaser.Physics.Arcade.Image {
	constructor(escena, x, y) {
		super(escena, x, y, 'bala-guardia-azul');
		this.dano = 0;
	}

	/**
	 * Activa la bala en (x, y) y la lanza en la dirección dada (un vector de largo 1). `datos` trae su dibujo
	 * (`textura`), su `velocidad` (px/s) y su `dano` (corazones): son los del campo `disparo` del tipo de enemigo.
	 */
	lanzar(x, y, direccion, { textura, velocidad, dano }) {
		this.setTexture(textura);
		this.enableBody(true, x, y, true, true);
		this.setDepth(CONFIG.DISPARO.PROFUNDIDAD_BALAS);
		this.dano = dano;
		this.setVelocity(direccion.x * velocidad, direccion.y * velocidad);
	}

	/** Apaga la bala para que se pueda reutilizar. */
	desactivar() {
		this.disableBody(true, true);
	}
}
