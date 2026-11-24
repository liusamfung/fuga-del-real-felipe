import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { SALA_DE_PRUEBA } from '../datos/salaDePrueba.js';
import { EnemigoDebil } from '../entidades/EnemigoDebil.js';
import { Jugador } from '../entidades/Jugador.js';
import { Disparo } from '../sistemas/Disparo.js';
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

		this.disparo = new Disparo(this, this.bloques);
		this.input.setDefaultCursor('crosshair');

		this.#crearEnemigos();
	}

	update() {
		this.jugador.mover(this.entrada.direccionDeMovimiento());

		for (const enemigo of this.enemigos.getChildren()) {
			enemigo.perseguir(this.jugador);
		}

		if (this.entrada.estaDisparando()) {
			this.disparo.intentarDisparar(this.jugador, this.entrada.puntoDeApuntado());
		}
		this.disparo.actualizar();
	}

	#crearEnemigos() {
		// Debe ser un grupo de física (no `this.add.group()`): con un grupo normal Phaser entrega
		// los objetos de un choque en orden invertido (enemigo, bala) y el callback falla.
		this.enemigos = this.physics.add.group();
		this.enemigosVivos = SALA_DE_PRUEBA.enemigos.length;
		this.salaLimpia = this.enemigosVivos === 0;

		for (const { x, y } of SALA_DE_PRUEBA.enemigos) {
			const enemigo = new EnemigoDebil(this, x, y);
			enemigo.once('muerto', () => this.#alMorirUnEnemigo());
			this.enemigos.add(enemigo);
		}

		this.physics.add.collider(this.enemigos, this.bloques);
		this.physics.add.collider(this.enemigos, this.enemigos);
		this.physics.add.collider(this.jugador, this.enemigos);
		this.physics.add.overlap(this.disparo.balas, this.enemigos, (bala, enemigo) =>
			this.#alImpactarUnaBala(bala, enemigo),
		);
	}

	#alImpactarUnaBala(bala, enemigo) {
		if (!bala.active || !enemigo.active) {
			return;
		}
		enemigo.recibirDano(bala.dano);
		bala.desactivar();
	}

	#alMorirUnEnemigo() {
		this.enemigosVivos -= 1;
		if (this.enemigosVivos === 0) {
			this.salaLimpia = true;
			// Más adelante el cofre y las puertas se enganchan a este evento.
			this.events.emit('sala-limpia');
			this.#mostrarMensaje('¡Sala limpia!');
		}
	}

	#mostrarMensaje(texto) {
		const { ANCHO, ALTO } = CONFIG.SALA;
		const mensaje = this.add
			.text(ANCHO / 2, ALTO / 2, texto, {
				fontFamily: 'monospace',
				fontSize: '32px',
				color: '#c9b79c',
			})
			.setOrigin(0.5)
			.setDepth(CONFIG.PROFUNDIDAD_MENSAJES);

		this.tweens.add({
			targets: mensaje,
			alpha: 0,
			delay: 1200,
			duration: 600,
			onComplete: () => mensaje.destroy(),
		});
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
