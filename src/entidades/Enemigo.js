import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { TIPOS_DE_ENEMIGO } from '../datos/enemigos.js';
import { Tirador } from '../sistemas/Tirador.js';
import { direccionesDelAbanico } from '../utilidades/abanico.js';
import { normalizar } from '../utilidades/vectores.js';

// Un enemigo: el débil de siempre, una de las ratas o uno de los guardias. Las ratas y el débil caminan en línea
// recta hacia el jugador; los guardias DISPARAN (campo `disparo` del tipo): mantienen una distancia, se detienen a
// apuntar y sueltan balas, que salen del grupo `escena.balasEnemigas`. Lo que los distingue (dibujo, vida,
// velocidad, daño y cómo disparan) viene del tipo (src/datos/enemigos.js).
// Avisa con el evento `muerto` cuando se le acaba la vida; así la escena sabe cuándo la sala
// quedó limpia sin tener que contar enemigos en cada fotograma.
export class Enemigo extends Phaser.Physics.Arcade.Sprite {
	/** `tipo` es una de las claves de `TIPOS_DE_ENEMIGO` ('debil', 'rata-gris', 'rata-blanca'…). */
	constructor(escena, x, y, tipo) {
		const datos = TIPOS_DE_ENEMIGO[tipo];
		if (!datos) {
			throw new Error(`Tipo de enemigo desconocido: "${tipo}"`);
		}

		super(escena, x, y, datos.textura);
		escena.add.existing(this);
		escena.physics.add.existing(this);

		const { ANCHO, ALTO, CUERPO_ANCHO, CUERPO_ALTO } = CONFIG.ENEMIGO;
		this.tipo = tipo;
		this.datos = datos;
		this.vida = datos.vida;
		this.velocidad = datos.velocidad;
		// Lo que le quita al jugador al tocarlo. Un enemigo letal le quita infinito: el jugador resta
		// `vida - daño` y no baja de 0, así que muere con las vidas que tenga (aunque mejore su vida máxima).
		this.dano = datos.letal ? Infinity : datos.dano;
		this.letal = datos.letal === true;

		// El cuerpo está centrado a lo ancho y pegado al borde de abajo, pero es alto (ver config.js).
		this.body.setSize(CUERPO_ANCHO, CUERPO_ALTO);
		this.body.setOffset((ANCHO - CUERPO_ANCHO) / 2, ALTO - CUERPO_ALTO);

		this.anims.play(datos.animacion);

		// Los que disparan llevan un `Tirador` que decide cuándo moverse, apuntar y disparar. El primer disparo se
		// retrasa un poco al azar para que los de una misma sala no disparen todos a la vez.
		this.tirador = null;
		this.avisando = false; // verdadero mientras parpadea apuntando
		if (datos.disparo) {
			const { disparo } = datos;
			this.tirador = new Tirador({
				...disparo,
				primerDisparo: escena.time.now + disparo.primerDisparo + Math.random() * disparo.variacion,
			});
		}
	}

	/**
	 * Un fotograma de comportamiento hacia el objetivo (un objeto con cuerpo físico, como el jugador): las ratas y el
	 * débil caminan en línea recta hacia él; los guardias hacen lo suyo (ver `#actuarComoTirador`).
	 */
	perseguir(objetivo) {
		if (this.tirador) {
			this.#actuarComoTirador(objetivo);
			return;
		}

		const direccion = normalizar(
			objetivo.body.center.x - this.body.center.x,
			objetivo.body.center.y - this.body.center.y,
		);
		this.setVelocity(direccion.x * this.velocidad, direccion.y * this.velocidad);
		this.setDepth(this.body.bottom);
	}

	// Un guardia: se acerca, se aleja o se queda quieto según la distancia; cuando le toca se detiene un momento
	// parpadeando (el aviso) y dispara hacia donde está el jugador en ese instante.
	#actuarComoTirador(objetivo) {
		const ahora = this.scene.time.now;
		const dx = objetivo.body.center.x - this.body.center.x;
		const dy = objetivo.body.center.y - this.body.center.y;
		const direccion = normalizar(dx, dy);

		const accion = this.tirador.actualizar(ahora, Math.hypot(dx, dy));
		const sentido = { acercarse: 1, alejarse: -1, quieto: 0 }[accion.movimiento];
		this.setVelocity(
			direccion.x * this.velocidad * sentido,
			direccion.y * this.velocidad * sentido,
		);
		this.setDepth(this.body.bottom);

		if (sentido === 0) {
			this.anims.stop();
			this.setFrame(0); // de pie
		} else {
			this.anims.play(this.datos.animacion, true);
		}

		this.#mostrarElAviso(accion.apuntando, ahora);
		if (accion.disparar) {
			this.#disparar(direccion);
		}
	}

	// Mientras apunta parpadea en rojo (cada 90 ms), así el jugador ve venir el disparo.
	#mostrarElAviso(apuntando, ahora) {
		if (apuntando) {
			this.avisando = true;
			if (Math.floor(ahora / 90) % 2 === 0) {
				this.setTint(0xff7a6a);
			} else {
				this.clearTint();
			}
		} else if (this.avisando) {
			this.avisando = false;
			this.clearTint();
		}
	}

	// Suelta el disparo desde el centro del cuerpo: una bala, o un abanico si el patrón de su tipo es 'abanico'.
	#disparar(haciaElJugador) {
		if (haciaElJugador.x === 0 && haciaElJugador.y === 0) {
			return; // el jugador está justo encima: no hay hacia dónde
		}

		const { disparo } = this.datos;
		const direcciones =
			disparo.patron === 'abanico'
				? direccionesDelAbanico(haciaElJugador, disparo.cantidad, disparo.apertura)
				: [haciaElJugador];
		const origen = { x: this.body.center.x, y: this.body.center.y };
		for (const direccion of direcciones) {
			this.scene.balasEnemigas.disparar(origen, direccion, disparo);
		}
	}

	/** Resta vida. Si llega a cero, el enemigo muere; si no, parpadea en blanco un instante. */
	recibirDano(cantidad) {
		if (!this.active) {
			return;
		}

		this.vida -= cantidad;
		if (this.vida <= 0) {
			this.morir();
		} else {
			this.#destellar();
		}
	}

	morir() {
		this.emit('muerto', this);
		this.destroy();
	}

	#destellar() {
		// En Phaser 4 el relleno de color se hace con el modo de tinte FILL (setTintFill ya no existe).
		this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
		this.scene.time.delayedCall(CONFIG.ENEMIGO.DESTELLO, () => {
			if (this.active) {
				this.clearTint();
			}
		});
	}
}
