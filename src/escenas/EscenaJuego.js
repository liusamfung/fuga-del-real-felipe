import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { SALA_DE_PRUEBA } from '../datos/salaDePrueba.js';
import { Cofre } from '../entidades/Cofre.js';
import { EnemigoDebil } from '../entidades/EnemigoDebil.js';
import { Jugador } from '../entidades/Jugador.js';
import { Disparo } from '../sistemas/Disparo.js';
import { Entrada } from '../sistemas/Entrada.js';
import { aplicarMejora, elegirMejoraComun } from '../sistemas/Recompensas.js';

// Una sala con el jugador dentro. Por ahora es siempre la sala de prueba.
export class EscenaJuego extends Phaser.Scene {
	constructor() {
		super(ESCENAS.JUEGO);
	}

	create() {
		this.jugadorMuerto = false;
		this.entrada = new Entrada(this);

		this.#crearSuelo();
		this.bloques = this.physics.add.staticGroup();
		this.#crearParedes();
		this.#crearObstaculos();

		const { x, y } = SALA_DE_PRUEBA.jugadorInicial;
		this.jugador = new Jugador(this, x, y);
		this.jugador.once('muerto', () => this.#alMorirElJugador());
		this.physics.add.collider(this.jugador, this.bloques);

		this.disparo = new Disparo(this, this.bloques);
		this.input.setDefaultCursor('crosshair');

		this.#crearEnemigos();
		this.#conectarEventos();

		// La interfaz es otra escena que se dibuja encima.
		this.scene.launch(ESCENAS.HUD, { jugador: this.jugador });
	}

	update() {
		if (this.jugadorMuerto) {
			return;
		}

		this.jugador.mover(this.entrada.direccionDeMovimiento());

		for (const enemigo of this.enemigos.getChildren()) {
			enemigo.perseguir(this.jugador);
		}

		if (this.entrada.estaDisparando()) {
			const { ataque } = this.jugador.estadisticas;
			this.disparo.intentarDisparar(this.jugador, this.entrada.puntoDeApuntado(), ataque);
		}
		this.disparo.actualizar();
	}

	#conectarEventos() {
		this.events.once('sala-limpia', this.#aparecerCofre, this);

		// Los listeners de `this.events` NO se borran solos cuando la escena se reinicia (al morir
		// el jugador): hay que quitarlos al cerrar, o se acumularían y el cofre saldría repetido.
		this.events.once('shutdown', () => {
			this.events.off('sala-limpia', this.#aparecerCofre, this);
			this.scene.stop(ESCENAS.HUD);
		});
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
		this.physics.add.collider(this.jugador, this.enemigos, (_jugador, enemigo) =>
			this.jugador.recibirDano(enemigo.dano),
		);
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
			this.events.emit('sala-limpia');
			this.#mostrarMensaje('¡Sala limpia!');
		}
	}

	#aparecerCofre() {
		const { x, y } = SALA_DE_PRUEBA.cofre;
		const cofre = new Cofre(this, x, y, elegirMejoraComun());
		this.physics.add.collider(this.jugador, cofre, () => this.#alTocarElCofre(cofre));
	}

	#alTocarElCofre(cofre) {
		const mejora = cofre.abrir();
		if (mejora === null) {
			return; // ya estaba abierto
		}

		const texto = aplicarMejora(this.jugador, mejora);
		this.#mostrarMensaje(texto, { x: cofre.x, y: cofre.y - 40, tamano: 18, sube: true });
	}

	// Muerte provisional: se reinicia la sala. Qué pasa de verdad al morir (volver a la portada,
	// reiniciar el nivel, Revivir…) está por decidir; ver docs/decisiones-pendientes.md.
	#alMorirElJugador() {
		this.jugadorMuerto = true;
		this.physics.pause();
		this.#mostrarMensaje('Has muerto');
		this.time.delayedCall(1800, () => this.scene.restart());
	}

	#mostrarMensaje(
		texto,
		{ x = CONFIG.SALA.ANCHO / 2, y = CONFIG.SALA.ALTO / 2, tamano = 32, sube = false } = {},
	) {
		const mensaje = this.add
			.text(x, y, texto, {
				fontFamily: 'monospace',
				fontSize: `${tamano}px`,
				color: '#c9b79c',
			})
			.setOrigin(0.5)
			.setDepth(CONFIG.PROFUNDIDAD_MENSAJES);

		this.tweens.add({
			targets: mensaje,
			alpha: 0,
			y: sube ? y - 30 : y,
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
