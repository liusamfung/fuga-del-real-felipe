import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { cuadroQuietoDelJugador } from '../datos/animaciones.js';
import { Dash } from '../sistemas/Dash.js';
import { VECTORES_DE_DIRECCION } from '../utilidades/vectores.js';

// El personaje que controla el jugador: se mueve, hace dash, tiene vida y puede mejorar sus
// estadísticas. Mira hacia donde apunta el ratón (porque hacia ahí dispara) y camina con la
// animación de esa dirección.
//
// Eventos que emite:
//   - 'estadisticas-cambiadas': cambió la vida o alguna estadística (lo escucha el HUD).
//   - 'muerto': la vida llegó a cero.
export class Jugador extends Phaser.Physics.Arcade.Sprite {
	constructor(escena, x, y) {
		super(escena, x, y, 'jugador');
		escena.add.existing(this);
		escena.physics.add.existing(this);

		const { ANCHO, ALTO, CUERPO_ANCHO, CUERPO_ALTO } = CONFIG.JUGADOR;
		const { VIDA_INICIAL, ATAQUE_INICIAL, VELOCIDAD } = CONFIG.JUGADOR;

		this.estadisticas = {
			vidaMaxima: VIDA_INICIAL,
			vida: VIDA_INICIAL,
			ataque: ATAQUE_INICIAL,
			velocidad: VELOCIDAD,
		};
		this.inmuneHasta = 0; // instante (en ms del reloj de la escena) hasta el que no recibe daño
		this.direccionMirada = 'abajo'; // 'abajo', 'derecha', 'izquierda' o 'arriba'
		this.tieneLlave = false; // la llave de la sala del jefe
		this.dash = new Dash({
			duracion: CONFIG.DASH.DURACION,
			recarga: CONFIG.DASH.RECARGA,
			cargasMaximas: CONFIG.DASH.CARGAS_INICIALES,
		});
		this.ultimaEstela = 0; // instante de la última imagen de la estela del dash

		// El cuerpo de choque son solo los pies: centrado a lo ancho y pegado al borde de abajo.
		this.body.setSize(CUERPO_ANCHO, CUERPO_ALTO);
		this.body.setOffset((ANCHO - CUERPO_ANCHO) / 2, ALTO - CUERPO_ALTO);
	}

	/**
	 * Mueve al jugador en la dirección dada (un vector de largo 1, o (0, 0) para quedarse quieto).
	 * Durante un dash no hace caso: el jugador va en línea recta, rápido, y deja una estela.
	 */
	mover(direccion) {
		const ahora = this.scene.time.now;

		if (this.dash.estaActivo(ahora)) {
			const { x, y } = this.dash.direccion;
			this.setVelocity(x * CONFIG.DASH.VELOCIDAD, y * CONFIG.DASH.VELOCIDAD);
			this.#dejarEstela(ahora);
		} else {
			const { velocidad } = this.estadisticas;
			this.setVelocity(direccion.x * velocidad, direccion.y * velocidad);
		}
		// Dibujar más adelante a quien está más abajo en la pantalla (vista top-down).
		this.setDepth(this.body.bottom);
	}

	/**
	 * Intenta hacer un dash. Va hacia donde se mueve el jugador (`direccion`, el mismo vector que
	 * se le pasa a `mover`) y, si está quieto, hacia donde mira. Devuelve verdadero si lo hizo.
	 * Mientras dura el dash el jugador no recibe daño.
	 */
	intentarDash(direccion) {
		const ahora = this.scene.time.now;
		const seMueve = direccion.x !== 0 || direccion.y !== 0;
		const haciaDonde = seMueve ? direccion : VECTORES_DE_DIRECCION[this.direccionMirada];

		if (!this.dash.intentar(haciaDonde, ahora)) {
			return false;
		}
		this.inmuneHasta = Math.max(this.inmuneHasta, ahora + CONFIG.DASH.INMUNIDAD);
		return true;
	}

	/**
	 * Elige el dibujo del jugador: mira hacia `puntoDeApuntado` y, si se mueve, camina.
	 * `direccion` es el mismo vector que se le pasó a `mover`. Si `puntoDeApuntado` es null (el
	 * ratón aún no se ha movido), sigue mirando hacia donde miraba.
	 */
	actualizarAnimacion(direccion, puntoDeApuntado) {
		if (puntoDeApuntado) {
			this.direccionMirada = this.#direccionHacia(puntoDeApuntado);
		}

		const seMueve =
			direccion.x !== 0 || direccion.y !== 0 || this.dash.estaActivo(this.scene.time.now);
		if (seMueve) {
			// `true`: si ya se está reproduciendo esta animación, no la reinicia.
			this.anims.play(`jugador-caminar-${this.direccionMirada}`, true);
		} else {
			this.anims.stop();
			this.setFrame(cuadroQuietoDelJugador(this.direccionMirada));
		}
	}

	/** 'abajo', 'derecha', 'izquierda' o 'arriba', según el eje en que el punto está más lejos. */
	#direccionHacia(punto) {
		const dx = punto.x - this.x;
		const dy = punto.y - this.y;

		if (Math.abs(dx) > Math.abs(dy)) {
			return dx > 0 ? 'derecha' : 'izquierda';
		}
		return dy > 0 ? 'abajo' : 'arriba';
	}

	/**
	 * Resta vida si el jugador no está en su tiempo de inmunidad. Devuelve verdadero si hubo daño.
	 * Después de un golpe parpadea durante la inmunidad, así se ve que no puede recibir más.
	 */
	recibirDano(cantidad) {
		const ahora = this.scene.time.now;
		if (ahora < this.inmuneHasta || this.estadisticas.vida <= 0) {
			return false;
		}

		this.estadisticas.vida = Math.max(0, this.estadisticas.vida - cantidad);
		this.inmuneHasta = ahora + CONFIG.JUGADOR.INMUNIDAD;
		this.emit('estadisticas-cambiadas');

		if (this.estadisticas.vida === 0) {
			this.emit('muerto');
		} else {
			this.#parpadear();
		}
		return true;
	}

	/**
	 * Sube una estadística ('vidaMaxima', 'ataque' o 'velocidad'). Al subir la vida máxima, la
	 * vida actual sube lo mismo: el corazón nuevo viene lleno.
	 */
	mejorar(estadistica, cantidad) {
		this.estadisticas[estadistica] += cantidad;
		if (estadistica === 'vidaMaxima') {
			this.estadisticas.vida += cantidad;
		}
		this.emit('estadisticas-cambiadas');
	}

	/** Guarda la llave del jefe. La llave no se gasta: abre las puertas para siempre. */
	recogerLlave() {
		this.tieneLlave = true;
		this.emit('estadisticas-cambiadas');
	}

	/** Deja una copia azulada del jugador que se desvanece: así se ve el recorrido del dash. */
	#dejarEstela(ahora) {
		if (ahora - this.ultimaEstela < CONFIG.DASH.INTERVALO_DE_ESTELA) {
			return;
		}
		this.ultimaEstela = ahora;

		const copia = this.scene.add
			.image(this.x, this.y, this.texture.key, this.frame.name)
			.setTint(0x7f9bff)
			.setAlpha(0.6)
			.setDepth(this.depth - 1);
		this.scene.tweens.add({
			targets: copia,
			alpha: 0,
			duration: 220,
			onComplete: () => copia.destroy(),
		});
	}

	#parpadear() {
		const periodo = 200; // ms que dura un parpadeo completo (se apaga y se enciende)
		this.scene.tweens.add({
			targets: this,
			alpha: 0.3,
			duration: periodo / 2,
			yoyo: true,
			repeat: Math.round(CONFIG.JUGADOR.INMUNIDAD / periodo) - 1,
			onComplete: () => this.setAlpha(1),
		});
	}
}
