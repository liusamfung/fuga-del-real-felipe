import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { SALA_DE_PRUEBA } from '../datos/salaDePrueba.js';
import { Jugador } from '../entidades/Jugador.js';
import { Entrada } from '../sistemas/Entrada.js';

// Una sala con el jugador dentro. Por ahora es siempre la sala de prueba.
export class EscenaJuego extends Phaser.Scene {
	constructor() {
		super(ESCENAS.JUEGO);
	}

	create() {
		this.entrada = new Entrada(this);

		this.#crearSuelo();
		this.bloques = this.physics.add.staticGroup();
		this.#crearParedes();
		this.#crearObstaculos();

		const { x, y } = SALA_DE_PRUEBA.jugadorInicial;
		this.jugador = new Jugador(this, x, y);
		this.physics.add.collider(this.jugador, this.bloques);
	}

	update() {
		this.jugador.mover(this.entrada.direccionDeMovimiento());
	}

	#crearSuelo() {
		const { ANCHO, ALTO } = CONFIG.SALA;
		this.add.tileSprite(0, 0, ANCHO, ALTO, 'suelo').setOrigin(0, 0).setDepth(-1);
	}

	#crearParedes() {
		for (const { x, y, ancho, alto } of SALA_DE_PRUEBA.paredes) {
			const pared = this.add.tileSprite(x, y, ancho, alto, 'pared').setOrigin(0, 0);
			pared.setDepth(y + alto);
			this.bloques.add(pared);
		}
	}

	#crearObstaculos() {
		for (const { x, y, ancho, alto } of SALA_DE_PRUEBA.obstaculos) {
			const caja = this.add.tileSprite(x, y, ancho, alto, 'caja').setOrigin(0, 0);
			caja.setDepth(y + alto);
			this.bloques.add(caja);
		}
	}
}
