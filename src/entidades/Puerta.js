import Phaser from 'phaser';

// Una puerta de reja. Cuando está cerrada es un obstáculo sólido y se ve; cuando está abierta no
// se ve y se puede pasar. Tiene tres estados:
//   - abierta: se puede pasar.
//   - cerrada: la cierra el combate de una sala y se abre al limpiarla.
//   - cerrada con llave: da a la sala del jefe y solo se abre con la llave (`desbloquear`).
//
// Es un cuerpo estático: se agrega a un grupo estático de física (`grupo.add(puerta)`), que es
// quien le da el cuerpo. Por eso `cerrar` y `abrir` solo se pueden usar después de agregarla.
export class Puerta extends Phaser.Physics.Arcade.Sprite {
	/**
	 * @param x, y el centro de la puerta, en el mundo
	 * @param lado 'arriba', 'abajo', 'izquierda' o 'derecha': de qué pared de su sala es
	 * @param bloqueadaPorLlave si es verdadero, solo se abre con la llave
	 */
	constructor(escena, x, y, lado, bloqueadaPorLlave) {
		const horizontal = lado === 'arriba' || lado === 'abajo';
		const tipo = bloqueadaPorLlave ? 'puerta-llave' : 'puerta';
		super(escena, x, y, `${tipo}-${horizontal ? 'h' : 'v'}`);
		escena.add.existing(this);

		this.lado = lado;
		this.bloqueadaPorLlave = bloqueadaPorLlave;
		this.cerrada = false;
	}

	cerrar() {
		this.cerrada = true;
		this.setVisible(true);
		this.body.enable = true;
	}

	abrir() {
		this.cerrada = false;
		this.setVisible(false);
		this.body.enable = false;
	}

	/** Le quita la llave a la puerta y la abre. Después funciona como una puerta normal. */
	desbloquear() {
		this.bloqueadaPorLlave = false;
		this.abrir();
	}
}
